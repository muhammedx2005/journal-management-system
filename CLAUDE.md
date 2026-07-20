# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

A role-based, multi-journal academic journal management system (Node/Express/EJS, PostgreSQL backend via `pg`, hosted on Supabase). This is a rewrite of a legacy PHP application (referred to in code comments as `web1/`); many comments explain the equivalent old PHP file/function being replaced (e.g. `web1/app/connect.php`, `web1/user/function.php`). Code and comments are primarily in Turkish (UI-facing strings, comments) — match this convention when editing existing files.

## Commands

- `npm run dev` — start with nodemon (auto-restart) for local development
- `npm start` — start normally (`node server.js`)
- No test suite, linter, or build step is configured in this repo.

### Database setup
- Database lives in Supabase (managed PostgreSQL) — no local database install needed. `config/database.js` creates a `pg` `Pool` from `DATABASE_URL` and exposes async `queryOne`/`queryAll`/`execute` helpers plus `initDatabase()`, which runs `db/schema.sql` against it. `server.js` awaits `initDatabase()` before calling `app.listen`. The schema is idempotent (`CREATE TABLE IF NOT EXISTS`, `DROP TRIGGER IF EXISTS` + `CREATE TRIGGER`), so this is safe to re-run on every startup and there is no separate manual migration step.
- On every startup, `src/startup/seedSuperadmin.js` (`ensureSuperadminSeed`) checks for a user with the hardcoded seed email and, if missing, creates an editor account with the superadmin flag set — this guarantees a first login always exists even on a fresh Supabase database, without running the CLI scripts below by hand.
- `node scripts/create-editor.js "Ad" "Soyad" "email@ornek.com" "Sifre123!"` — creates an editor account (editor role has no public self-signup form by design).
- `node scripts/setup-admin.js [sourceEmail] [targetEmail] [password]` — promotes an existing editor account to superadmin (adds `is_superadmin` flag; does not create a new role). Defaults to promoting `editor@test.com` to a hardcoded target if run with no args.

### Environment
Config is read from `.env` (see keys already present: `JOURNAL_KEY`, `DATABASE_URL`, `DATABASE_SSL` (optional, default true), `SESSION_SECRET`, `PORT`, `SMTP_*`). `DATABASE_URL` must be a Supabase **Transaction pooler** connection string (port 6543) — Render and similar IPv4-only hosts cannot reach Supabase's direct (IPv6) connection.

## Architecture

### Multi-journal configuration (central, no hardcoding)
`config/journal.config.js` loads a journal definition from `config/journals/<JOURNAL_KEY>.config.js` based on the `JOURNAL_KEY` env var, and exposes it as `res.locals.journal` to every view via the `attachJournalToViews` middleware (wired in `src/app.js`). **No page, controller, or mail template should ever hardcode a journal's name, editor, contact info, or copy** — everything (nav labels, hero text, editor-in-chief bio, mail sender name/address, author guidelines, indexing DB list) must be read from the active journal config. Adding a new journal = adding a new file under `config/journals/` and switching `JOURNAL_KEY`; `src/services/mailService.js` templates and views are journal-agnostic and take `journal` as a parameter.

### Roles and auth model
Four roles live in `src/constants/roles.js`: `author`, `reviewer`, `editor`, `superadmin`. Critically, **superadmin is not a `role` value** — the `users.role` column has a CHECK constraint accepting only `author|reviewer|editor`. Superadmin is a separate `is_superadmin` bit flag layered on top of an existing account (normally an editor), so one account can access both its own role's pages and `/superadmin/*`. There is no superadmin signup/login page; it's granted via `scripts/setup-admin.js` and authenticated through `/editor/login`.

Each role module (author/reviewer/editor) has its **own** `/login`, `/logout`, and (for author/reviewer only) `/signup` routes/views — there is no unified login. `src/utils/loginPath.js` centralizes the "which login page should an unauthenticated user be bounced to" logic based on URL prefix, used by both `authMiddleware.requireAuth` and `roleMiddleware.requireRole`/`requireSuperadmin`.

`src/middlewares/roleMiddleware.js`: `requireRole(...roles)` checks `session.user.role`; `requireSuperadmin()` checks `session.user.isSuperadmin` independently. Session user shape (set at login in each controller): `{ id, name, email, role, isSuperadmin }`.

### Request flow
`server.js` → awaits `initDatabase()` + `ensureSuperadminSeed()` → requires `src/app.js`, which wires global middleware (session, `attachJournalToViews`, `res.locals.user`) then mounts routers by prefix: `/` (public), `/author`, `/reviewer`, `/editor`, `/files`, `/superadmin`. Routes → controllers (`src/controllers/*`) → models (`src/models/*`, raw `pg` queries via `config/database.js`'s `queryOne`/`queryAll`/`execute` helpers, always parameterized with `@paramName` — never string-concatenate user input into SQL) → EJS views (`src/views/<role>/*.ejs`, shared `partials/`). Async route handlers must be wrapped in `src/utils/asyncHandler.js` (Express 4 doesn't catch rejected promises in async handlers); this matters everywhere now since model/database calls are fully asynchronous (see Database layer below), not just mail/file-upload code.

### Submission / review lifecycle
Status values live in `src/constants/submissionStatus.js`: `submitted → under_review → (revision_required | accepted | rejected) → published`. `under_review` is set automatically the first time a reviewer is assigned (see `editorController.assignReviewer`); `published` is a distinct action (`editorController.publishSubmission`) only allowed from `accepted`, separate from the general decision flow (`editorController.decideSubmission`, which only allows `DECIDABLE_STATUSES = [revision_required, accepted, rejected]`). Recommendation values (hakem tavsiyesi) live separately in `src/constants/reviewRecommendation.js`.

Data model: `submissions` (author FK) ← `review_assignments` (submission FK + reviewer FK, unique per pair) ← `reviews` (one-to-one with an assignment, unique `assignment_id`). Cascade deletes are manual and order-dependent (enforced by controller call order, not DB `ON DELETE CASCADE`): delete `reviews` before `review_assignments` before `submissions`/`users` — see the delete functions and their comments in `reviewModel.js` / `reviewAssignmentModel.js`.

### File uploads
Paper files are stored **outside** `public/`, in `storage/uploads/` (via `src/middlewares/uploadMiddleware.js`, multer disk storage, PDF/DOC/DOCX only, 20MB limit), specifically so they can't be fetched directly through `express.static`. The only access path is `GET /files/:id` (`src/controllers/fileController.js`), which authorizes per-request: published submissions are open to anyone; otherwise only the author, an assigned reviewer, or any editor may download. Filenames are sanitized with `path.basename` to prevent path traversal. When touching upload/download logic, preserve this single-choke-point access control — don't add a second way to reach files under `storage/uploads/`.

### Database layer
`config/database.js` opens a shared `pg` `Pool` (exported as `pool`) from `DATABASE_URL`, imported (indirectly, via the exported helpers) by every model. It exposes `queryOne`/`queryAll`/`execute` — all `async`, all take `(sql, paramsObject)` where `sql` uses named `@paramName` placeholders (converted internally to `pg`'s positional `$1, $2...` — never build SQL via string concatenation) — plus `initDatabase()`, which runs `db/schema.sql` on startup (idempotent). PostgreSQL enforces foreign keys by default (unlike SQLite), so the manual cascade-delete ordering described above is enforced by the database itself as well as by controller call order. Every model function is `async` and every call site must `await` it — unlike the previous synchronous `better-sqlite3` driver, an un-awaited call here returns a pending `Promise`, not data. `COUNT(*)` and other aggregate results come back from `pg` as strings (`bigint` semantics), not numbers — model functions that return counts (`submissionModel.countByAuthorId`, `countsByStatus`) explicitly `Number(...)` them before returning.

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

A role-based, multi-journal academic journal management system (Node/Express/EJS, SQLite backend via `better-sqlite3`). This is a rewrite of a legacy PHP application (referred to in code comments as `web1/`); many comments explain the equivalent old PHP file/function being replaced (e.g. `web1/app/connect.php`, `web1/user/function.php`). Code and comments are primarily in Turkish (UI-facing strings, comments) — match this convention when editing existing files.

## Commands

- `npm run dev` — start with nodemon (auto-restart) for local development
- `npm start` — start normally (`node server.js`)
- No test suite, linter, or build step is configured in this repo.

### Database setup
- No external database server needed. `config/database.js` opens (creating if missing) a single SQLite file at `DB_PATH` (default `data/journal.db`) and runs `db/schema.sql` against it automatically on every startup — the schema is idempotent (`CREATE TABLE`/`CREATE TRIGGER IF NOT EXISTS`), so this is safe to re-run and there is no separate manual setup step.
- `node scripts/create-editor.js "Ad" "Soyad" "email@ornek.com" "Sifre123!"` — creates the first editor account (editor role has no public self-signup form by design).
- `node scripts/setup-admin.js [sourceEmail] [targetEmail] [password]` — promotes an existing editor account to superadmin (adds `is_superadmin` flag; does not create a new role). Defaults to promoting `editor@test.com` to a hardcoded target if run with no args.

### Environment
Config is read from `.env` (see keys already present: `JOURNAL_KEY`, `DB_PATH`, `SESSION_SECRET`, `PORT`, `SMTP_*`).

## Architecture

### Multi-journal configuration (central, no hardcoding)
`config/journal.config.js` loads a journal definition from `config/journals/<JOURNAL_KEY>.config.js` based on the `JOURNAL_KEY` env var, and exposes it as `res.locals.journal` to every view via the `attachJournalToViews` middleware (wired in `src/app.js`). **No page, controller, or mail template should ever hardcode a journal's name, editor, contact info, or copy** — everything (nav labels, hero text, editor-in-chief bio, mail sender name/address, author guidelines, indexing DB list) must be read from the active journal config. Adding a new journal = adding a new file under `config/journals/` and switching `JOURNAL_KEY`; `src/services/mailService.js` templates and views are journal-agnostic and take `journal` as a parameter.

### Roles and auth model
Four roles live in `src/constants/roles.js`: `author`, `reviewer`, `editor`, `superadmin`. Critically, **superadmin is not a `role` value** — the `users.role` column has a CHECK constraint accepting only `author|reviewer|editor`. Superadmin is a separate `is_superadmin` bit flag layered on top of an existing account (normally an editor), so one account can access both its own role's pages and `/superadmin/*`. There is no superadmin signup/login page; it's granted via `scripts/setup-admin.js` and authenticated through `/editor/login`.

Each role module (author/reviewer/editor) has its **own** `/login`, `/logout`, and (for author/reviewer only) `/signup` routes/views — there is no unified login. `src/utils/loginPath.js` centralizes the "which login page should an unauthenticated user be bounced to" logic based on URL prefix, used by both `authMiddleware.requireAuth` and `roleMiddleware.requireRole`/`requireSuperadmin`.

`src/middlewares/roleMiddleware.js`: `requireRole(...roles)` checks `session.user.role`; `requireSuperadmin()` checks `session.user.isSuperadmin` independently. Session user shape (set at login in each controller): `{ id, name, email, role, isSuperadmin }`.

### Request flow
`server.js` → `src/app.js` wires global middleware (session, `attachJournalToViews`, `res.locals.user`) then mounts routers by prefix: `/` (public), `/author`, `/reviewer`, `/editor`, `/files`, `/superadmin`. Routes → controllers (`src/controllers/*`) → models (`src/models/*`, raw `better-sqlite3` queries, always parameterized with `@paramName` — never string-concatenate user input into SQL) → EJS views (`src/views/<role>/*.ejs`, shared `partials/`). Async route handlers must be wrapped in `src/utils/asyncHandler.js` (Express 4 doesn't catch rejected promises in async handlers — this matters for the remaining async work in controllers, e.g. mail sending and file uploads; model/database calls themselves are synchronous, see Database layer below).

### Submission / review lifecycle
Status values live in `src/constants/submissionStatus.js`: `submitted → under_review → (revision_required | accepted | rejected) → published`. `under_review` is set automatically the first time a reviewer is assigned (see `editorController.assignReviewer`); `published` is a distinct action (`editorController.publishSubmission`) only allowed from `accepted`, separate from the general decision flow (`editorController.decideSubmission`, which only allows `DECIDABLE_STATUSES = [revision_required, accepted, rejected]`). Recommendation values (hakem tavsiyesi) live separately in `src/constants/reviewRecommendation.js`.

Data model: `submissions` (author FK) ← `review_assignments` (submission FK + reviewer FK, unique per pair) ← `reviews` (one-to-one with an assignment, unique `assignment_id`). Cascade deletes are manual and order-dependent (enforced by controller call order, not DB `ON DELETE CASCADE`): delete `reviews` before `review_assignments` before `submissions`/`users` — see the delete functions and their comments in `reviewModel.js` / `reviewAssignmentModel.js`.

### File uploads
Paper files are stored **outside** `public/`, in `storage/uploads/` (via `src/middlewares/uploadMiddleware.js`, multer disk storage, PDF/DOC/DOCX only, 20MB limit), specifically so they can't be fetched directly through `express.static`. The only access path is `GET /files/:id` (`src/controllers/fileController.js`), which authorizes per-request: published submissions are open to anyone; otherwise only the author, an assigned reviewer, or any editor may download. Filenames are sanitized with `path.basename` to prevent path traversal. When touching upload/download logic, preserve this single-choke-point access control — don't add a second way to reach files under `storage/uploads/`.

### Database layer
`config/database.js` opens a single shared `better-sqlite3` `Database` instance (exported as `db`), imported by every model, backed by a single file at `DB_PATH` (default `data/journal.db`; gitignored). It also runs `db/schema.sql` on every startup (idempotent) and enables `PRAGMA foreign_keys = ON` — SQLite doesn't enforce FKs by default, and the manual cascade-delete ordering described above depends on it. `better-sqlite3` is fully synchronous: model functions are plain (non-`async`) functions that call `db.prepare(sql).get/all/run(params)` with a params object matching the query's named `@paramName` placeholders; never build SQL via string concatenation. Because it's synchronous, there's no connection pool or `await` needed inside models — callers may still `await` a model call, which is a no-op on a non-promise value.

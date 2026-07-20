-- Journal Management System - baslangic semasi (PostgreSQL / Supabase)
-- Bu dosya uygulama her baslatildiginda config/database.js -> initDatabase()
-- tarafindan otomatik calistirilir; CREATE TABLE'lar "IF NOT EXISTS" korumali,
-- trigger'lar da DROP + CREATE ile idempotent oldugu icin tekrar calistirmak
-- (orn. her sunucu restart'inda) guvenlidir, ayri bir kurulum adimina gerek yoktur.

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    surname TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'author'
        CHECK (role IN ('author', 'reviewer', 'editor', 'superadmin')),
    institution TEXT,
    orcid_no TEXT,
    phone TEXT,
    -- Superadmin, ayri bir "role" degeri DEGIL, mevcut role'un (orn. 'editor')
    -- UZERINE eklenen bir yetki bayragidir. Boylece bir hesap ayni anda hem
    -- kendi rolunun panelini (editor/reviewer/author) hem de Superadmin panelini
    -- kullanabilir - role kolonundaki CHECK constraint tek deger kabul ettigi
    -- icin "hem editor hem superadmin" ancak boyle, ayri bir bayrakla mumkun olur.
    is_superadmin INTEGER NOT NULL DEFAULT 0,
    -- Kullanici onay durumu: yeni self-signup (author/reviewer) hesaplar 'pending'
    -- olarak baslar ve Superadmin onayi olmadan giris yapamaz (bkz. authorController.login,
    -- reviewerController.login). Editor hesaplari (sadece scripts/create-editor.js ile
    -- olusturulur, self-signup yoktur) status='approved' ile eklenir.
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'approved', 'rejected')),
    -- Coklu rol destegi: bir hesap ayni anda birden fazla portale (Yazar/Hakem/
    -- Editor) girebilir. "role" kolonu hesabin olusturuldugu birincil rolu
    -- gosteren geriye-donuk bilgi olarak kalir, ama yetkilendirme kararlari
    -- SADECE asagidaki bayraklardan okunur - is_superadmin ile ayni desen.
    is_author INTEGER NOT NULL DEFAULT 0,
    is_reviewer INTEGER NOT NULL DEFAULT 0,
    is_editor INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS submissions (
    id SERIAL PRIMARY KEY,
    paper_code TEXT NOT NULL UNIQUE,
    author_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    abstract TEXT NOT NULL,
    keywords TEXT,
    file_path TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'submitted'
        CHECK (status IN ('submitted', 'under_review', 'revision_required', 'accepted', 'rejected', 'published')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    FOREIGN KEY (author_id) REFERENCES users(id)
);

-- PostgreSQL'de MySQL/T-SQL'deki "ON UPDATE CURRENT_TIMESTAMP" karsiligi
-- yoktur; bir fonksiyon + trigger ile updated_at kolonu her UPDATE'te
-- otomatik guncellenir. "CREATE TRIGGER IF NOT EXISTS" PostgreSQL'de
-- desteklenmedigi icin DROP + CREATE ile idempotent hale getirildi.
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_submissions_updated_at ON submissions;
CREATE TRIGGER trg_submissions_updated_at
BEFORE UPDATE ON submissions
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- Hakem atamalari: bir makaleye birden fazla hakem atanabilir, ama ayni hakem
-- ayni makaleye sadece bir kez atanabilir (UNIQUE constraint).
CREATE TABLE IF NOT EXISTS review_assignments (
    id SERIAL PRIMARY KEY,
    submission_id INTEGER NOT NULL,
    reviewer_id INTEGER NOT NULL,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    FOREIGN KEY (submission_id) REFERENCES submissions(id),
    FOREIGN KEY (reviewer_id) REFERENCES users(id),
    UNIQUE (submission_id, reviewer_id)
);

-- Bir atama icin en fazla bir degerlendirme girilebilir (assignment_id UNIQUE).
CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    assignment_id INTEGER NOT NULL UNIQUE,
    recommendation TEXT NOT NULL
        CHECK (recommendation IN ('accept', 'minor_revision', 'major_revision', 'reject')),
    comments_for_editor TEXT NOT NULL,
    comments_for_author TEXT NOT NULL,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    FOREIGN KEY (assignment_id) REFERENCES review_assignments(id)
);

-- Test icin ornek bir yazar hesabi olusturmak isterseniz (sifre: Test1234!):
-- password_hash degeri bcryptjs ile uretilmelidir, bu yuzden hazir bir INSERT
-- vermek yerine kayit sayfasindan (signup) yeni kullanici olusturmaniz onerilir.
-- Hakem hesabi icin ayni sekilde /reviewer/signup sayfasi kullanilabilir.
-- Editor hesabinin self-signup sayfasi yoktur (hakem atamasi yapan rol oldugu
-- icin bilincli olarak disariya kapali tutulur); "node scripts/create-editor.js"
-- scripti ile olusturulur. Ilk superadmin hesabi ayrica server.js baslangicinda
-- calisan otomatik seed fonksiyonuyla da garanti altina alinir (bkz.
-- src/startup/seedSuperadmin.js).

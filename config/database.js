// SQLite baglantisi (web1/app/connect.php'nin karsiligi).
// "better-sqlite3" senkron calisir - ayri bir baglanti havuzuna gerek yoktur,
// tek bir dosya tabanli veritabanina tum uygulama boyunca tek bir baglanti
// uzerinden erisilir.
//
// Onemli fark: burada sorgular her zaman parametreli (@paramAdi) calistirilir,
// kullanici girdisi hicbir zaman string birlestirme ile SQL'e eklenmez.
const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");

const dbPath = process.env.DB_PATH || path.join(__dirname, "..", "data", "journal.db");
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new Database(dbPath);

// WAL, ayni anda okuma/yazma yapan istekler icin (bu uygulamadaki gibi
// coklu HTTP istegi tek proceste calisirken) kilitlenmeleri azaltir.
db.pragma("journal_mode = WAL");
// SQLite varsayilan olarak foreign key kisitlarini uygulamaz; schema.sql'deki
// FOREIGN KEY tanimlarinin (orn. review_assignments -> submissions) gecerli
// olmasi icin acikca acilmasi gerekir.
db.pragma("foreign_keys = ON");

// db/schema.sql tamamen "IF NOT EXISTS" korumali (CREATE TABLE/TRIGGER IF NOT
// EXISTS) oldugu icin her uygulama baslangicinda calistirmak guvenlidir; SSMS
// gibi ayri bir kurulum adimina gerek birakmaz.
const schemaPath = path.join(__dirname, "..", "db", "schema.sql");
db.exec(fs.readFileSync(schemaPath, "utf8"));

console.log(`SQLite baglantisi kuruldu (${dbPath})`);

// mssql, DATETIME2 kolonlarini otomatik olarak JS Date nesnesine cevirirdi;
// SQLite'da (schema.sql'de strftime(...) ile ISO-8601 metni olarak saklanir)
// bu donusum yoktur. Views bu kolonlar uzerinde dogrudan Date metodlari
// (orn. submission.created_at.toLocaleDateString(...)) cagirdigi icin ayni
// davranisi burada geri kazandiriyoruz - kolon adi "_at" ile bitiyorsa (created_at,
// updated_at, assigned_at, submitted_at) ve deger bir string ise Date'e ceviriyoruz.
function withDates(row) {
  if (!row) return row;
  for (const key of Object.keys(row)) {
    if (key.endsWith("_at") && typeof row[key] === "string") {
      row[key] = new Date(row[key]);
    }
  }
  return row;
}

function withDatesAll(rows) {
  return rows.map(withDates);
}

module.exports = { db, withDates, withDatesAll };

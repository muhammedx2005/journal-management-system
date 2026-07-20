// PostgreSQL (Supabase) baglantisi (web1/app/connect.php'nin karsiligi).
// Onceden better-sqlite3 ile tek dosyalik, senkron bir baglanti kullaniliyordu;
// Render'da kalici disk olmadan tamamen ucretsiz kalabilmek icin veritabani
// Supabase'de (yonetilen PostgreSQL) barinir - baglanti bilgisi tek bir
// DATABASE_URL ortam degiskeninden okunur (bkz. .env).
//
// pg paketi "node-postgres" - bir baglanti havuzu (Pool) uzerinden calisir ve
// TAMAMEN ASENKRONDUR (better-sqlite3'un aksine). Bu yuzden asagidaki query
// yardimcilari Promise dondurur; modellerdeki tum cagrilar await ile kullanilir.
//
// Onemli fark (ayni prensip korunuyor): sorgular hicbir zaman string
// birlestirme ile SQL'e eklenmez. better-sqlite3'teki @paramAdi stilini
// korumak icin, asagidaki queryToPg() @paramAdi yer tutucularini pg'nin
// bekledigi $1, $2... pozisyonel parametrelerine cevirir - boylece model
// dosyalarindaki SQL metinleri neredeyse degismeden kalabildi.
const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error(
    "DATABASE_URL ortam degiskeni tanimli degil. .env dosyasina Supabase 'Connection string' " +
      "(Transaction pooler, port 6543 onerilir - Render gibi IPv4 ortamlarda dogrudan baglanti calismaz) degerini ekleyin."
  );
}

// Supabase, disaridan gelen tum baglantilarda SSL zorunlu kilar. Yerel bir
// Postgres'e SSL olmadan baglanmak icin (orn. gelistirme ortaminda) .env'e
// DATABASE_SSL=false eklenebilir.
const useSSL = process.env.DATABASE_SSL !== "false";

const pool = new Pool({
  connectionString,
  ssl: useSSL ? { rejectUnauthorized: false } : false,
});

pool.on("error", (err) => {
  // Havuzdaki bosta bekleyen bir baglanti beklenmedik sekilde koparsa (orn.
  // Supabase tarafinda idle timeout) surecin tamamen cokmesini onler - hata
  // loglanir, havuz kendini toparlar.
  console.error("Beklenmeyen PostgreSQL havuzu hatasi:", err);
});

// SQL metnindeki @paramAdi yer tutucularini pg'nin $1, $2... pozisyonel
// parametrelerine cevirir ve params nesnesinden sirali bir degerler dizisi
// uretir.
function toPgQuery(sql, params = {}) {
  const values = [];
  const text = sql.replace(/@(\w+)/g, (match, name) => {
    if (!(name in params)) {
      throw new Error(`Sorguda kullanilan "@${name}" parametresi saglanmadi.`);
    }
    values.push(params[name]);
    return `$${values.length}`;
  });
  return { text, values };
}

// Tek satir donen sorgular icin (better-sqlite3'teki .get() karsiligi).
async function queryOne(sql, params) {
  const { text, values } = toPgQuery(sql, params);
  const result = await pool.query(text, values);
  return result.rows[0];
}

// Birden fazla satir donen sorgular icin (better-sqlite3'teki .all() karsiligi).
async function queryAll(sql, params) {
  const { text, values } = toPgQuery(sql, params);
  const result = await pool.query(text, values);
  return result.rows;
}

// INSERT/UPDATE/DELETE icin (better-sqlite3'teki .run() karsiligi). Donen
// pg sonucunun "rows" alani, sorguda RETURNING kullanilmissa doldurulur -
// orn. "INSERT ... RETURNING id" ile result.rows[0].id (lastInsertRowid karsiligi).
async function execute(sql, params) {
  const { text, values } = toPgQuery(sql, params);
  return pool.query(text, values);
}

// better-sqlite3'te tarih kolonlari ISO-8601 metni olarak saklaniyordu ve
// views'daki .toLocaleDateString() gibi cagrilarin calismasi icin elle Date'e
// cevriliyordu (bkz. eski withDates). pg suruculugu TIMESTAMPTZ kolonlarini
// zaten native JS Date nesnesi olarak dondurur, bu yuzden burada ekstra bir
// donusume gerek yok - fonksiyonlar sadece modellerdeki mevcut cagrilarla
// (withDates(row)/withDatesAll(rows)) uyumluluk icin passthrough olarak kaldi.
function withDates(row) {
  return row;
}

function withDatesAll(rows) {
  return rows;
}

// db/schema.sql tamamen "IF NOT EXISTS" korumali (CREATE TABLE IF NOT EXISTS,
// DROP TRIGGER IF EXISTS + CREATE TRIGGER) oldugu icin her uygulama
// baslangicinda calistirmak guvenlidir; ayri bir manuel kurulum adimina gerek
// birakmaz. pg, parametre verilmeden yapilan pool.query() cagrilarinda birden
// fazla ";" ile ayrilmis ifadeyi tek seferde calistirabilir (simple query protokolu).
async function initDatabase() {
  const schemaPath = path.join(__dirname, "..", "db", "schema.sql");
  const schemaSql = fs.readFileSync(schemaPath, "utf8");
  await pool.query(schemaSql);
  console.log("PostgreSQL semasi hazir (Supabase).");
}

module.exports = { pool, queryOne, queryAll, execute, withDates, withDatesAll, initDatabase };

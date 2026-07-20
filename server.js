require("dotenv").config();
const { initDatabase, pool } = require("./config/database");
const { ensureSuperadminSeed } = require("./src/startup/seedSuperadmin");

const PORT = process.env.PORT || 3000;
// PaaS platformlari (Render dahil) disaridan sadece 0.0.0.0'a bind edilmis
// portlara yonlendirme yapar; host belirtmeden birakmak coğu ortamda calisir
// ama burada acikca yaziyoruz ki yanlis-yapilandirma ihtimali sifira insin.
const HOST = "0.0.0.0";

let server;

// pg (Supabase) baglantisi ve sema kurulumu asenkron oldugu icin (better-sqlite3'un
// aksine), app.listen'dan ONCE veritabaninin hazir olmasini bekliyoruz - aksi
// halde ilk istekler sema henuz olusturulmadan gelebilir.
async function start() {
  await initDatabase();
  await ensureSuperadminSeed();

  const app = require("./src/app");

  server = app.listen(PORT, HOST, () => {
    console.log(`Journal Management System http://localhost:${PORT} adresinde calisiyor`);
    console.log(`Aktif dergi: ${process.env.JOURNAL_KEY || "demo-journal"}`);
  });
}

start().catch((err) => {
  console.error("Sunucu baslatilamadi:", err);
  process.exit(1);
});

// Render, her deploy/restart'ta (uyku moduna gecerken degil, yeniden
// baslatirken) once SIGTERM gonderir. Bunu yakalamazsak devam eden istekler
// yaric kesilir - "sayfa eksik yuklendi" hissinin bir kaynagi da budur.
// Baglantiyi duzgunce kapatip (HTTP sunucusu + pg havuzu), hala acik istek
// varsa 10 saniye bekleyip zorla cikiyoruz.
function shutdown(signal) {
  console.log(`${signal} alindi, sunucu kapatiliyor...`);
  if (server) {
    server.close(() => {
      pool.end().finally(() => process.exit(0));
    });
  } else {
    process.exit(0);
  }
  setTimeout(() => process.exit(1), 10000).unref();
}
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

// Yakalanmamis bir hata (orn. yanlis JOURNAL_KEY, disk yazma hatasi) sunucuyu
// "yari canli" birakabilir - process ayakta kalir ama her istek patlar, ve
// Render bunu "calisiyor" sanip yeniden baslatmaz. Bunun yerine acikca
// cikiyoruz ki Render'in restart mekanizmasi devreye girsin ve hata loglarda
// gorunsun (sessizce "Not Found" donmek yerine).
process.on("uncaughtException", (err) => {
  console.error("Yakalanmamis hata:", err);
  process.exit(1);
});
process.on("unhandledRejection", (err) => {
  console.error("Yakalanmamis promise reddi:", err);
  process.exit(1);
});

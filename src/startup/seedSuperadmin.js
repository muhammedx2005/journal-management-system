// Uygulama her baslatildiginda calisan otomatik seed: veritabaninda hedef
// e-postaya sahip bir hesap yoksa, editor + superadmin yetkisine sahip bir
// hesap olusturur. Render/Supabase gibi kalici olmayan/yeniden kurulan
// ortamlarda "node scripts/create-editor.js" + "node scripts/setup-admin.js"
// adimlarini elle calistirmaya gerek kalmadan ilk girisin her zaman mumkun
// olmasini saglar. Hesap zaten varsa hicbir sey yapmaz (idempotent).
const bcrypt = require("bcryptjs");
const userModel = require("../models/userModel");

const SALT_ROUNDS = 10;

const SEED_EMAIL = "muhammedkrx@gmail.com";
const SEED_PASSWORD = "ŞİFRE123";
const SEED_NAME = "Muhammed";
const SEED_SURNAME = "Kara";

async function ensureSuperadminSeed() {
  const existing = await userModel.findByEmail(SEED_EMAIL);
  if (existing) {
    return;
  }

  const passwordHash = await bcrypt.hash(SEED_PASSWORD, SALT_ROUNDS);
  const editor = await userModel.createEditor({
    name: SEED_NAME,
    surname: SEED_SURNAME,
    email: SEED_EMAIL,
    passwordHash,
  });

  await userModel.promoteToSuperadmin({
    id: editor.id,
    name: SEED_NAME,
    surname: SEED_SURNAME,
    email: SEED_EMAIL,
    passwordHash,
  });

  console.log(`Ilk superadmin hesabi olusturuldu: ${SEED_EMAIL} (giris: /editor/login)`);
}

module.exports = { ensureSuperadminSeed };

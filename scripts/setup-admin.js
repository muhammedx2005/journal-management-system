// Tek seferlik CLI: mevcut bir editor hesabini Superadmin yetkisiyle
// donatir. Superadmin ayri bir "role" degeri DEGILDIR (users.role kolonundaki
// CHECK constraint tek deger kabul eder) - bunun yerine hesabin uzerine
// is_superadmin bayragi eklenir. Boylece hesap hem editor panelini
// (/editor/dashboard) hem Superadmin panelini (/superadmin/dashboard) kullanabilir,
// ve giris islemi degismeden /editor/login uzerinden yapilmaya devam eder.
//
// Kullanim (varsayilan degerlerle, aynen istendigi gibi):
//   node scripts/setup-admin.js
//
// Farkli bir kaynak/hedef ile calistirmak isterseniz:
//   node scripts/setup-admin.js "kaynak@eposta.com" "hedef@eposta.com" "YeniSifre123"
require("dotenv").config();
const bcrypt = require("bcryptjs");
const { queryOne } = require("../config/database");
const userModel = require("../src/models/userModel");

const SALT_ROUNDS = 10;

const DEFAULT_SOURCE_EMAIL = "editor@test.com";
const DEFAULT_TARGET_EMAIL = "muhammedkrx@gmail.com";
const DEFAULT_PASSWORD = "ŞİFRE123";
const DEFAULT_NAME = "Muhammed";
const DEFAULT_SURNAME = "Kara";

// db/schema.sql, config/database.js tarafindan her baslangicta calistirildigi
// icin is_superadmin kolonu (ve tum sema) buraya gelindiginde zaten garanti
// altindadir - SQL Server'daki gibi ayrica bir ALTER TABLE kontrolune gerek yoktur.

async function findSourceUser(sourceEmail) {
  const byEmail = await userModel.findByEmail(sourceEmail);
  if (byEmail) return byEmail;

  // E-posta tam eslesmezse (orn. daha once degistirilmisse), tek bir editor
  // hesabi varsa onu bulmayi dene - boylece script tekrar tekrar calistirilabilir.
  return (await queryOne("SELECT * FROM users WHERE role = 'editor' ORDER BY id LIMIT 1")) || null;
}

async function main() {
  const [sourceEmailArg, targetEmailArg, passwordArg] = process.argv.slice(2);
  const sourceEmail = sourceEmailArg || DEFAULT_SOURCE_EMAIL;
  const targetEmail = targetEmailArg || DEFAULT_TARGET_EMAIL;
  const newPassword = passwordArg || DEFAULT_PASSWORD;

  const sourceUser = await findSourceUser(sourceEmail);
  if (!sourceUser) {
    console.error(
      `"${sourceEmail}" e-postali bir kullanici (veya rolu 'editor' olan herhangi bir hesap) bulunamadi. ` +
        `Once "node scripts/create-editor.js" ile bir editor hesabi olusturun.`
    );
    process.exitCode = 1;
    return;
  }

  const clashingUser = await userModel.findByEmail(targetEmail);
  if (clashingUser && clashingUser.id !== sourceUser.id) {
    console.error(
      `"${targetEmail}" e-postasi zaten baska bir kullaniciya ait (id: ${clashingUser.id}). ` +
        `Islem iptal edildi.`
    );
    process.exitCode = 1;
    return;
  }

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  const updatedUser = await userModel.promoteToSuperadmin({
    id: sourceUser.id,
    name: DEFAULT_NAME,
    surname: DEFAULT_SURNAME,
    email: targetEmail,
    passwordHash,
  });

  console.log("Superadmin yetkisi basariyla tanimlandi:");
  console.log(`  Ad Soyad : ${updatedUser.name} ${updatedUser.surname}`);
  console.log(`  E-posta  : ${updatedUser.email}`);
  console.log(`  Rol      : ${updatedUser.role} (+ Superadmin bayragi)`);
  console.log("");
  console.log(`Giris: /editor/login uzerinden "${targetEmail}" ve belirlediginiz sifre ile giris yapin.`);
  console.log(`Giris sonrasi /superadmin/dashboard adresinden Superadmin paneline ulasabilirsiniz.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => process.exit());

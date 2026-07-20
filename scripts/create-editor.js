// Tek seferlik CLI: editor hesabi olusturur. Editor rolunun self-signup sayfasi
// bilincli olarak yok (hakem atamasi yapan rol oldugu icin disariya kapali),
// bu yuzden ilk editor hesabi bu script ile olusturulur.
//
// Kullanim:
//   node scripts/create-editor.js "Ad" "Soyad" "email@ornek.com" "Sifre123!"
require("dotenv").config();
const bcrypt = require("bcryptjs");
const userModel = require("../src/models/userModel");

const SALT_ROUNDS = 10;

async function main() {
  const [name, surname, email, password] = process.argv.slice(2);

  if (!name || !surname || !email || !password) {
    console.error('Kullanim: node scripts/create-editor.js "Ad" "Soyad" "email@ornek.com" "Sifre"');
    process.exitCode = 1;
    return;
  }

  const existingUser = await userModel.findByEmail(email);
  if (existingUser) {
    console.error("Bu e-posta adresi zaten kayitli.");
    process.exitCode = 1;
    return;
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const editor = await userModel.createEditor({ name, surname, email, passwordHash });

  console.log(`Editor hesabi olusturuldu: ${editor.email} (id: ${editor.id})`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => process.exit());

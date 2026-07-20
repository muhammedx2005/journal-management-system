// Merkezi dergi konfigurasyon yukleyicisi.
//
// web1/app/defination.php dosyasindaki gorevi ustlenir: dergiye ozel butun
// bilgiler (isim, editor, mail adresleri, logo...) BURADAN okunur. Hicbir
// sayfa/controller icinde dergi adi veya editor bilgisi hardcoded yazilmaz.
//
// Hangi derginin aktif oldugu JOURNAL_KEY environment degiskeni ile secilir.
// Yeni bir dergi icin sadece journals/ altina yeni bir config dosyasi eklemek
// ve .env icinde JOURNAL_KEY'i degistirmek yeterlidir.
const fs = require("fs");
const path = require("path");

const JOURNALS_DIR = path.join(__dirname, "journals");

function loadJournalConfig(journalKey) {
  const configPath = path.join(JOURNALS_DIR, `${journalKey}.config.js`);

  if (!fs.existsSync(configPath)) {
    const available = fs
      .readdirSync(JOURNALS_DIR)
      .filter((file) => file.endsWith(".config.js"))
      .map((file) => file.replace(".config.js", ""));

    throw new Error(
      `Dergi konfigurasyonu bulunamadi: "${journalKey}". ` +
        `Mevcut secenekler: ${available.join(", ")}. ` +
        `config/journals/${journalKey}.config.js dosyasini olusturun veya JOURNAL_KEY'i duzeltin.`
    );
  }

  return require(configPath);
}

const activeJournal = loadJournalConfig(process.env.JOURNAL_KEY || "demo-journal");

// Express middleware: aktif dergiyi tum view'larda `journal` degiskeni olarak kullanilabilir yapar.
function attachJournalToViews(req, res, next) {
  res.locals.journal = activeJournal;
  next();
}

module.exports = {
  activeJournal,
  attachJournalToViews,
};

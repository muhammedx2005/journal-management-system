require("dotenv").config();
const app = require("./src/app");

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Journal Management System http://localhost:${PORT} adresinde calisiyor`);
  console.log(`Aktif dergi: ${process.env.JOURNAL_KEY || "demo-journal"}`);
});

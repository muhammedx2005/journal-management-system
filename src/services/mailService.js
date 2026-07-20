// E-posta gonderim servisi. web1'de PHPMailer + her sayfaya gomulu HTML metinler
// kullaniliyordu (orn. user/send_review_request.php icindeki sabit mesaj metni).
// Burada mesaj SABIT DEGIL: her sablon fonksiyonu `journal` objesini parametre
// olarak alir ve konu/govde metnini o dergiye gore uretir. Ayni kod hem
// demo-journal hem sample-science hem de eklenecek yeni bir dergi icin calisir.
const nodemailer = require("nodemailer");

function createTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
      : undefined,
  });
}

// Sablon: makale basvurusu alindi bildirimi. Dergiye ozel hicbir metin burada
// hardcoded degildir - hepsi `journal` parametresinden gelir.
function formatEditorInChief(journal) {
  const { title, name } = journal.editorInChief;
  return title ? `${title} ${name}` : name;
}

function buildSubmissionReceivedTemplate(journal, { authorName, paperCode, paperTitle }) {
  return {
    subject: `[${journal.shortName}] Makale Başvurunuz Alındı - ${paperCode}`,
    text: [
      `Sayın ${authorName},`,
      ``,
      `"${paperTitle}" başlıklı makaleniz ${journal.name} dergisine başarıyla yüklenmiştir.`,
      `Makale kodunuz: ${paperCode}`,
      ``,
      `Başvurunuzun durumunu hesabınızdan takip edebilirsiniz.`,
      ``,
      `Saygılarımızla,`,
      formatEditorInChief(journal),
      `${journal.name}`,
    ].join("\n"),
  };
}

async function sendSubmissionReceivedMail(journal, toEmail, data) {
  const transport = createTransport();
  const { subject, text } = buildSubmissionReceivedTemplate(journal, data);

  await transport.sendMail({
    from: `"${journal.mail.fromName}" <${journal.mail.fromAddress}>`,
    to: toEmail,
    subject,
    text,
  });
}

// Sablon: editorun nihai karari (revizyon/kabul/red) veya yayina alma bildirimi.
// reviewerComments doluysa (hakemlerin "yazara yonelik yorum" alanlari) hakem
// kimligi belirtilmeden, numaralandirilarak eklenir.
function buildDecisionTemplate(journal, { authorName, paperCode, paperTitle, statusLabel, message, reviewerComments }) {
  const lines = [
    `Sayın ${authorName},`,
    ``,
    `"${paperTitle}" başlıklı makalenizin durumu güncellenmiştir.`,
    `Makale Kodu: ${paperCode}`,
    `Yeni Durum: ${statusLabel}`,
  ];

  if (message) {
    lines.push(``, `Editör Notu:`, message);
  }

  if (reviewerComments && reviewerComments.length > 0) {
    lines.push(``, `Hakem Yorumları:`);
    reviewerComments.forEach((comment, index) => {
      lines.push(``, `Hakem ${index + 1}:`, comment);
    });
  }

  lines.push(``, `Saygılarımızla,`, formatEditorInChief(journal), `${journal.name}`);

  return {
    subject: `[${journal.shortName}] Makale Durumu Güncellendi - ${paperCode}`,
    text: lines.join("\n"),
  };
}

async function sendDecisionMail(journal, toEmail, data) {
  const transport = createTransport();
  const { subject, text } = buildDecisionTemplate(journal, data);

  await transport.sendMail({
    from: `"${journal.mail.fromName}" <${journal.mail.fromAddress}>`,
    to: toEmail,
    subject,
    text,
  });
}

module.exports = {
  sendSubmissionReceivedMail,
  buildSubmissionReceivedTemplate,
  sendDecisionMail,
  buildDecisionTemplate,
};

// Hakem tavsiye karari secenekleri. submissionStatus.js'deki desenle ayni:
// tek yerden okunabilir sabitler + etiket sozlugu.
const RECOMMENDATION = {
  ACCEPT: "accept",
  MINOR_REVISION: "minor_revision",
  MAJOR_REVISION: "major_revision",
  REJECT: "reject",
};

const RECOMMENDATION_LABELS = {
  [RECOMMENDATION.ACCEPT]: "Kabul",
  [RECOMMENDATION.MINOR_REVISION]: "Küçük Revizyon",
  [RECOMMENDATION.MAJOR_REVISION]: "Büyük Revizyon",
  [RECOMMENDATION.REJECT]: "Red",
};

module.exports = { RECOMMENDATION, RECOMMENDATION_LABELS };

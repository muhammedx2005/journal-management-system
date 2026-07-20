// Ornek dergi konfigurasyonu #2 - "coklu dergi" destegini gostermek icindir.
// JOURNAL_KEY=sample-science yapildiginda sistem otomatik olarak bu dergiyi kullanir.
// demo-journal.config.js ile AYNI semayi paylasir; sadece icerik/gorseller farklidir.
module.exports = {
  key: "sample-science",
  name: "International Journal of Sample Sciences",
  shortName: "IJSS",
  tagline: "Fen Bilimlerinde Uluslararası Hakemli Araştırmalar",
  issn: "1111-1111",
  domain: "www.sample-science.example",
  logoUrl: "/img/sample-science-logo.png",
  paperIdPrefix: "IJSS",

  navigation: [
    { label: "Ana Sayfa", path: "/" },
    { label: "Hakkımızda", path: "/about" },
    { label: "Makaleler ve Sayılar", path: "/articles" },
    { label: "Yazarlara Rehber", path: "/author-guidelines" },
    { label: "İndeksler", path: "/indexing" },
    { label: "İletişim", path: "/contact" },
  ],

  contact: {
    generalEmail: "info@sample-science.example",
    phone: "+90 000 000 0000",
    address: "Örnek Üniversitesi, Fen Fakültesi, Ankara, Türkiye",
  },

  editorInChief: {
    title: "Prof. Dr.",
    name: "Mehmet Yılmaz",
    initials: "MY",
    institution: "Örnek Üniversitesi",
    department: "Fen Bilimleri",
    birthDate: "",
    email: "editor@sample-science.example",
    phone: "+90 000 000 0000",
    bio: "Fen bilimleri alanında uluslararası akademik yayıncılık süreçlerini yürütmektedir.",
  },

  editorialManagerEmail: "manager@sample-science.example",

  mail: {
    fromName: "International Journal of Sample Sciences",
    fromAddress: "no-reply@sample-science.example",
  },

  about: {
    summary:
      "International Journal of Sample Sciences (IJSS), fen bilimleri alanında özgün ve " +
      "hakemli araştırmaları uluslararası akademik camiaya kazandırmayı amaçlayan açık " +
      "erişimli bir dergidir.",
    mission:
      "Fen bilimleri alanındaki özgün araştırmaları titiz bir hakem sürecinden geçirerek " +
      "uluslararası camiaya kazandırmak.",
    vision:
      "Disiplinlerarası fen bilimleri araştırmalarında referans gösterilen bir yayın " +
      "platformu olmak.",
    focusAreas: ["Temel Bilimler", "Uygulamalı Araştırmalar", "Disiplinlerarası Çalışmalar"],
  },

  authorGuidelines: {
    intro:
      "Dergimize gönderilecek çalışmaların akademik yazım standartlarına uygun şekilde " +
      "hazırlanması değerlendirme sürecini hızlandırır.",
    submissionSteps: [
      "Yazar hesabınızla sisteme kayıt olun ve makalenizi çevrimiçi formdan yükleyin.",
      "Makaleniz editoryal ön incelemeden geçer.",
      "Uygun bulunan çalışmalar bağımsız hakemlere gönderilir.",
      "Hakem raporları doğrultusunda revizyon istenebilir.",
      "Kabul edilen makaleler dergi sayısında yayımlanır.",
    ],
    formattingRules: [
      "Makaleler Türkçe veya İngilizce hazırlanabilir.",
      "Öz, anahtar kelimeler ve kaynakça bölümleri eksiksiz olmalıdır.",
      "Tutarlı bir akademik atıf standardı kullanılmalıdır.",
    ],
    reviewProcess:
      "Dergimiz çift-kör hakemlik modelini benimser. Ortalama değerlendirme süresi 4-8 haftadır.",
  },

  indexingDatabases: [
    { name: "Google Scholar", status: "Hedefleniyor", icon: "bi-mortarboard" },
    { name: "Crossref (DOI)", status: "Hedefleniyor", icon: "bi-link-45deg" },
    { name: "DOAJ", status: "Hedefleniyor", icon: "bi-unlock" },
  ],

  media: {
    heroImage:
      "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=1920&q=80",
    heroImageAlt: "Laboratuvar ortamında bilimsel araştırma",
    aboutImage:
      "https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&w=1200&q=80",
    aboutImageAlt: "Mikroskopla çalışan bir araştırmacı",
    guidelinesImage:
      "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80",
    guidelinesImageAlt: "Not alan bir araştırmacının eli",
    indexingImage:
      "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80",
    indexingImageAlt: "Dünya haritası üzerinde bağlantı noktaları",
    contactImage:
      "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80",
    contactImageAlt: "Toplantı odasında çalışan bir ekip",
    homeGallery: [
      {
        url: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80",
        alt: "Laboratuvar ekipmanları",
      },
      {
        url: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=800&q=80",
        alt: "Kütüphanede çalışan öğrenciler",
      },
      {
        url: "https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=800&q=80",
        alt: "Test tüpleri ile laboratuvar çalışması",
      },
    ],
  },
};

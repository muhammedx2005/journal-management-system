// Aktif dergi konfigurasyonu: Journal of Modern Software and Computer Engineering (JMSCE).
// Bu dosyadaki HICBIR deger view/controller icine hardcoded yazilmaz; tum sayfalar
// (navbar, footer, ana sayfa, hakkimizda, iletisim, yazar rehberi, indeksler) buradan okur.
// Yeni bir dergi eklemek icin bu dosyayi kopyalayip alanlari doldurmak yeterlidir.
module.exports = {
  key: "demo-journal",
  name: "Journal of Modern Software and Computer Engineering",
  shortName: "JMSCE",
  tagline: "Yazılım Mühendisliğinde ve Bilgisayar Bilimlerinde Vizyoner Araştırmalar",
  issn: "0000-0000",
  domain: "www.jmsce-journal.example",
  logoUrl: "/img/demo-journal-logo.png",
  paperIdPrefix: "JMSCE",

  // Navbar ve footer'daki menu basliklari BURADAN gelir; view'larda sabit metin yoktur.
  navigation: [
    { label: "Ana Sayfa", path: "/" },
    { label: "Hakkımızda", path: "/about" },
    { label: "Makaleler ve Sayılar", path: "/articles" },
    { label: "Yazarlara Rehber", path: "/author-guidelines" },
    { label: "İndeksler", path: "/indexing" },
    { label: "İletişim", path: "/contact" },
  ],

  contact: {
    generalEmail: "muhammedkrx@gmail.com",
    phone: "+90 0542 278 3940",
    address: "Tarsus, Mersin",
  },

  // Bas Editor profili: Hakkimizda ve Iletisim sayfalarindaki editoryal profil karti buradan beslenir.
  editorInChief: {
    title: "",
    name: "Muhammed Kara",
    initials: "MK",
    institution: "İskenderun Teknik Üniversitesi (İSTE)",
    department: "Bilgisayar Mühendisliği",
    birthDate: "17.09.2005",
    email: "muhammedkrx@gmail.com",
    phone: "+90 0542 278 3940",
    bio:
      "Yazılım mühendisliği, yapay zeka destekli sistemler ve modern bilgisayar bilimleri " +
      "alanlarında akademik yayıncılık süreçlerini yürütmektedir.",
  },

  editorialManagerEmail: "manager@demo-journal.example",

  mail: {
    fromName: "Journal of Modern Software and Computer Engineering",
    fromAddress: "no-reply@demo-journal.example",
  },

  // Ana sayfa ve Hakkimizda sayfasindaki tanitim metinleri.
  about: {
    summary:
      "Journal of Modern Software and Computer Engineering (JMSCE), yazılım mühendisliği, " +
      "yapay zeka ve bilgisayar bilimlerinin öncü ve uygulanabilir araştırmalarını akademik " +
      "camiaya ve teknoloji sektörüne kazandırmayı amaçlayan açık erişimli, hakemli bir " +
      "dergidir. Teoriyi endüstriyel uygulamayla buluşturan, tekrarlanabilir ve etkisi geniş " +
      "çalışmalara açık bir yayın alanı sunuyoruz.",
    mission:
      "Yazılım geliştirme, yapay zeka ve sistem tasarımı alanlarında üretilen özgün bilgiyi " +
      "titiz bir hakem sürecinden geçirerek küresel akademik camiaya ve sektöre ulaştırmak.",
    vision:
      "Bilgisayar mühendisliği alanında yenilikçi fikirlerin buluştuğu, dijital dönüşüme yön " +
      "veren, uluslararası ölçekte referans gösterilen bir yayın platformu olmak.",
    focusAreas: [
      "Yapay Zeka ve Makine Öğrenmesi",
      "Yazılım Mühendisliği ve Sistem Tasarımı",
      "Veri Bilimi ve Büyük Veri Analitiği",
      "Siber Güvenlik",
      "Bulut Bilişim ve Dağıtık Sistemler",
      "İnsan-Bilgisayar Etkileşimi",
    ],
  },

  authorGuidelines: {
    intro:
      "Dergimize gönderilecek çalışmaların akademik yazım standartlarına ve aşağıdaki " +
      "sürece uygun şekilde hazırlanması, değerlendirme sürecinin hızlı ilerlemesini sağlar.",
    submissionSteps: [
      "Yazar hesabınızla sisteme kayıt olun ve makalenizi çevrimiçi formdan yükleyin.",
      "Makaleniz editoryal ön incelemeden geçer (kapsam ve format uygunluğu kontrolü).",
      "Uygun bulunan çalışmalar en az iki bağımsız hakeme kör hakemlik ile gönderilir.",
      "Hakem raporları doğrultusunda yazardan revizyon istenebilir.",
      "Kabul edilen makaleler, yayın sırasına alınarak dergi sayısında yayımlanır.",
    ],
    formattingRules: [
      "Makaleler Türkçe veya İngilizce olarak, 3.000–8.000 kelime aralığında hazırlanmalıdır.",
      "Başlık, öz (abstract), anahtar kelimeler, giriş, yöntem, bulgular, tartışma ve kaynakça bölümleri eksiksiz yer almalıdır.",
      "Kaynak gösteriminde tutarlı bir akademik atıf standardı (APA, IEEE vb.) kullanılmalıdır.",
      "Şekil, tablo ve kaynak kodu blokları numaralandırılmalı ve metin içinde referans verilmelidir.",
      "Makale, intihal oranı kabul edilebilir sınırlar içinde olacak şekilde özgün olmalıdır.",
    ],
    reviewProcess:
      "Dergimiz çift-kör hakemlik modelini benimser; yazar ve hakem kimlikleri süreç boyunca " +
      "karşılıklı olarak gizli tutulur. Ortalama değerlendirme süresi 4-8 haftadır.",
  },

  // Henuz basvuru/hedef asamasindaki dizinler; yanlis "indekslenmektedir" iddiasi
  // olusturmamak icin durum alani (status) ile birlikte tutulur.
  indexingDatabases: [
    { name: "Google Scholar", status: "Hedefleniyor", icon: "bi-mortarboard" },
    { name: "Crossref (DOI)", status: "Hedefleniyor", icon: "bi-link-45deg" },
    { name: "DOAJ", status: "Hedefleniyor", icon: "bi-unlock" },
    { name: "ROAD", status: "Hedefleniyor", icon: "bi-signpost-2" },
    { name: "Index Copernicus", status: "Hedefleniyor", icon: "bi-globe2" },
    { name: "ResearchGate", status: "Hedefleniyor", icon: "bi-people" },
  ],

  // Tum sayfalarda kullanilan gorseller (Unsplash). Dergi degistiginde gorseller de degisir.
  media: {
    heroImage:
      "https://images.unsplash.com/photo-1550439062-609e1531270e?auto=format&fit=crop&w=1920&q=80",
    heroImageAlt: "Karanlık arka planda ekranda akan yazılım kodu",
    aboutImage:
      "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80",
    aboutImageAlt: "Yapay zekayı simgeleyen insan ve robot eli teması",
    guidelinesImage:
      "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80",
    guidelinesImageAlt: "Dizüstü bilgisayarda makale yazan araştırmacı",
    indexingImage:
      "https://images.unsplash.com/photo-1571171637578-41bc2dd41cd2?auto=format&fit=crop&w=1200&q=80",
    indexingImageAlt: "Mavi ışıklarla aydınlatılmış veri merkezi sunucuları",
    contactImage:
      "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80",
    contactImageAlt: "Beyaz tahta önünde toplantı yapan bir ekip",
    homeGallery: [
      {
        url: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80",
        alt: "Ekranda makro çekim kaynak kodu",
      },
      {
        url: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80",
        alt: "Kütüphanede çalışan akademisyenler",
      },
      {
        url: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80",
        alt: "Yakın çekim devre kartı",
      },
    ],
  },
};

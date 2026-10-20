import type { Locale } from "@orkide/i18n";

import type { SiteContent } from "./site.ts";

/**
 * The site's shipped content, per locale: what each section shows until the admin saves its own
 * (the `site` API).
 */
export const siteDefaults: Record<Locale, SiteContent> = {
  en: {
    derive: {
      cta: "Read the source",
      kicker: "Build on it",
      lead: "Every product keeps Orkide as its upstream, so a fix or a feature made here merges into all of them.",
      steps: [
        {
          command: "git clone https://github.com/Ouzx/orkide",
          text: "Start from the template and keep it as the upstream remote.",
          title: "Clone",
        },
        {
          command: "pnpm install && pnpm dev",
          text: "Both Workers run locally on Miniflare, with D1, R2 and queues.",
          title: "Run",
        },
        {
          command: "pnpm --filter @orkide/ui tokens",
          text: "Edit the tokens, fonts and brand drawing; the pages stay as they are.",
          title: "Reskin",
        },
        {
          command: "git fetch upstream && git merge upstream/main",
          text: "Pull the template's fixes into your product. Your skin and your content stay yours.",
          title: "Merge",
        },
      ],
      title: "Start a product from Orkide",
      url: "https://github.com/Ouzx/orkide",
    },
    hero: {
      contactCta: "Get in touch",
      deriveCta: "Derive a product",
      eyebrow: "Open-source template for Cloudflare Workers",
      lead: "Orkide is a production-grade monorepo for Cloudflare: two Workers on one origin, typed end to end, with a blog, a portfolio and an admin already built. Derive a product from it and keep merging its fixes.",
      parts: [
        {
          name: "Browser",
          qty: "1",
          text: "Gets the HTML with its CSS inlined",
        },
        {
          name: "Edge cache",
          qty: "1",
          text: "Keeps each page, tagged by what it shows",
        },
        {
          name: "Web Worker · Astro",
          qty: "1",
          text: "Renders pages and owns every request",
        },
        {
          name: "Service Binding",
          qty: "1",
          text: "Hands /api over in process: no CORS, no hop",
        },
        {
          name: "API Worker · Hono",
          qty: "1",
          text: "Typed routes, roles and purge headers",
        },
        {
          name: "D1",
          qty: "1",
          text: "Posts and projects, one row per language",
        },
        { name: "R2", qty: "1", text: "Images and files" },
        { name: "Queues", qty: "2", text: "Jobs and their dead letters" },
        {
          name: "Durable Object",
          qty: "1",
          text: "Counts who is reading right now",
        },
      ],
      sourceCta: "Read the source",
      title: "Every product starts from these drawings.",
    },
    inside: {
      features: [
        {
          name: "Edge",
          text: "Astro renders at the edge and hands /api to a Hono Worker through a Service Binding. No CORS, no extra hop.",
          title: "Two Workers, one origin",
        },
        {
          name: "Types",
          text: "Drizzle tables generate the Zod models, the validators refine them and the API client is typed from the routes. No data type is written by hand.",
          title: "Typed end to end",
        },
        {
          name: "Cache",
          text: "Every page is cached at the edge under the tags it shows, and every save in the admin purges exactly those.",
          title: "Cached by tag",
        },
        {
          name: "Readers",
          text: "RSS, Atom and JSON feeds, a sitemap, llms.txt and a Markdown copy of every post and project.",
          title: "For people and agents",
        },
        {
          name: "Admin",
          text: "Posts, projects, media, site content, inbox and analytics, with owner, editor and viewer roles and passkey sign-in.",
          title: "An admin that ships",
        },
        {
          name: "Skin",
          text: "Tokens, fonts, motion and brand drawings live in one package, so a product changes its look without touching a page.",
          title: "A skin you can swap",
        },
      ],
      kicker: "What this site is made of",
      lead: "Orkide is this site and the template products start from: a production-grade Cloudflare monorepo, typed end to end and open source.",
      meters: [
        {
          label: "Workers, one origin",
          unit: "",
          value: "2",
        },
        {
          label: "Packages every product shares",
          unit: "",
          value: "10",
        },
        {
          label: "Decisions in the ADR log",
          unit: "",
          value: "32",
        },
        {
          label: "Framework code on reading pages",
          unit: "kB",
          value: "0",
        },
      ],
      title: "Inside Orkide",
    },
    stack: {
      kicker: "How this page reached you",
      note: "t+ milliseconds, measured on this page load in your browser.",
      stages: [
        {
          name: "Edge",
          text: "Your request lands at the closest Cloudflare data centre. Pages are cached there, tagged by what they show, and purged the moment a post changes.",
          timing: "Request",
          title: "The nearest edge location",
        },
        {
          name: "Worker",
          text: "The web Worker renders the page with Astro. Calls to /api go to a second Worker through a Service Binding: in-process, so there is no CORS and no extra hop.",
          timing: "First byte",
          title: "Two Workers, one origin",
        },
        {
          name: "D1",
          text: "Posts, projects and taxonomies live in D1, translated row by row and keyed by UUIDv7. Media sits next to them in R2.",
          timing: "Last byte",
          title: "One row per language",
        },
        {
          name: "Browser",
          text: "The HTML arrives with its stylesheet inlined and every script hashed into the CSP. JavaScript loads only where something moves.",
          timing: "Interactive",
          title: "Inlined and hashed",
        },
        {
          name: "Pixel",
          text: "Everything above exists to get this one right.",
          timing: "First paint",
          title: "One pixel",
        },
      ],
      title: "From edge infrastructure to the last pixel",
    },
  },
  tr: {
    derive: {
      cta: "Kaynağı oku",
      kicker: "Üzerine kur",
      lead: "Her ürün Orkide’yi upstream olarak tutar; burada yapılan bir düzeltme ya da özellik hepsine birleşir.",
      steps: [
        {
          command: "git clone https://github.com/Ouzx/orkide",
          text: "Şablondan başla ve onu upstream olarak tut.",
          title: "Klonla",
        },
        {
          command: "pnpm install && pnpm dev",
          text: "İki Worker da yerelde Miniflare üzerinde; D1, R2 ve kuyruklarla birlikte çalışır.",
          title: "Çalıştır",
        },
        {
          command: "pnpm --filter @orkide/ui tokens",
          text: "Token’ları, yazı tiplerini ve marka çizimini düzenle; sayfalar olduğu gibi kalır.",
          title: "Kapla",
        },
        {
          command: "git fetch upstream && git merge upstream/main",
          text: "Şablonun düzeltmelerini ürününe çek. Kaplaman da içeriğin de sende kalır.",
          title: "Birleştir",
        },
      ],
      title: "Orkide’den bir ürün başlat",
      url: "https://github.com/Ouzx/orkide",
    },
    hero: {
      contactCta: "İletişime geç",
      deriveCta: "Ürün türet",
      eyebrow: "Cloudflare Workers için açık kaynak şablon",
      lead: "Orkide, Cloudflare için üretim kalitesinde bir monorepo: tek kökende iki Worker, uçtan uca tipli; blog, portfolyo ve yönetim paneli hazır. Ondan bir ürün türet ve düzeltmelerini birleştirmeye devam et.",
      parts: [
        { name: "Tarayıcı", qty: "1", text: "CSS’i gömülü HTML’i alır" },
        {
          name: "Uç önbellek",
          qty: "1",
          text: "Her sayfayı gösterdiğiyle etiketleyip saklar",
        },
        {
          name: "Web Worker · Astro",
          qty: "1",
          text: "Sayfaları oluşturur, her isteği karşılar",
        },
        {
          name: "Service Binding",
          qty: "1",
          text: "/api’yi süreç içinde devreder: CORS yok, atlama yok",
        },
        {
          name: "API Worker · Hono",
          qty: "1",
          text: "Tipli rotalar, roller ve temizleme başlıkları",
        },
        {
          name: "D1",
          qty: "1",
          text: "Yazılar ve projeler, her dil için bir satır",
        },
        { name: "R2", qty: "1", text: "Görseller ve dosyalar" },
        { name: "Kuyruklar", qty: "2", text: "İşler ve teslim edilemeyenler" },
        {
          name: "Durable Object",
          qty: "1",
          text: "Şu an kaç kişinin okuduğunu sayar",
        },
      ],
      sourceCta: "Kaynağı oku",
      title: "Her ürün bu çizimlerden doğar.",
    },
    inside: {
      features: [
        {
          name: "Uç",
          text: "Astro uçta oluşturur ve /api çağrılarını bir Service Binding üzerinden Hono Worker’ına devreder. CORS da fazladan atlama da yok.",
          title: "İki Worker, tek köken",
        },
        {
          name: "Tipler",
          text: "Drizzle tabloları Zod modellerini üretir, doğrulayıcılar onları inceltir, API istemcisi de rotalardan tiplenir. Hiçbir veri tipi elle yazılmaz.",
          title: "Uçtan uca tipli",
        },
        {
          name: "Önbellek",
          text: "Her sayfa gösterdiği etiketlerle uçta önbelleğe alınır; yönetim panelindeki her kayıt tam olarak onları temizler.",
          title: "Etiketle önbellek",
        },
        {
          name: "Okurlar",
          text: "RSS, Atom ve JSON akışları, site haritası, llms.txt ve her yazı ile projenin Markdown kopyası.",
          title: "İnsanlar ve ajanlar için",
        },
        {
          name: "Panel",
          text: "Yazılar, projeler, medya, site içeriği, gelen kutusu ve analitik; sahip, editör ve izleyici rolleri ve passkey ile giriş.",
          title: "Hazır bir yönetim paneli",
        },
        {
          name: "Kaplama",
          text: "Token’lar, yazı tipleri, hareket ve marka çizimleri tek pakette; bir ürün tek sayfaya dokunmadan görünümünü değiştirir.",
          title: "Değiştirilebilir bir kaplama",
        },
      ],
      kicker: "Bu site neyden yapıldı",
      lead: "Orkide hem bu site hem de ürünlerin başladığı şablon: üretim kalitesinde, uçtan uca tipli ve açık kaynak bir Cloudflare monoreposu.",
      meters: [
        {
          label: "Worker, tek köken",
          unit: "",
          value: "2",
        },
        {
          label: "Her ürünün paylaştığı paket",
          unit: "",
          value: "10",
        },
        {
          label: "ADR kaydındaki karar",
          unit: "",
          value: "32",
        },
        {
          label: "Okuma sayfalarında framework kodu",
          unit: "kB",
          value: "0",
        },
      ],
      title: "Orkide’nin içi",
    },
    stack: {
      kicker: "Bu sayfa sana nasıl ulaştı",
      note: "t+ milisaniye, bu sayfa yüklenirken tarayıcında ölçüldü.",
      stages: [
        {
          name: "Uç",
          text: "İsteğin en yakın Cloudflare veri merkezine düşer. Sayfalar orada önbelleğe alınır, gösterdikleriyle etiketlenir ve bir yazı değiştiği an temizlenir.",
          timing: "İstek",
          title: "En yakın uç konum",
        },
        {
          name: "Worker",
          text: "Web Worker sayfayı Astro ile oluşturur. /api çağrıları bir Service Binding üzerinden ikinci Worker’a gider: süreç içinde, yani CORS da fazladan atlama da yok.",
          timing: "İlk bayt",
          title: "İki Worker, tek köken",
        },
        {
          name: "D1",
          text: "Yazılar, projeler ve sınıflandırmalar D1’de, satır satır çevrilmiş ve UUIDv7 ile anahtarlanmış olarak durur. Medya hemen yanında, R2’de.",
          timing: "Son bayt",
          title: "Her dil için bir satır",
        },
        {
          name: "Tarayıcı",
          text: "HTML, stil dosyası içine gömülü ve her betiği CSP’ye hash’lenmiş olarak gelir. JavaScript yalnızca bir şey hareket ediyorsa yüklenir.",
          timing: "Etkileşim",
          title: "Gömülü ve hash’li",
        },
        {
          name: "Piksel",
          text: "Yukarıdaki her şey bunu doğru yapmak için var.",
          timing: "İlk boyama",
          title: "Tek bir piksel",
        },
      ],
      title: "Uç altyapıdan son piksele",
    },
  },
};

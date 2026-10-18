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
      ],
      title: "Start a product from Orkide",
      url: "https://github.com/Ouzx/orkide",
    },
    hero: {
      contactCta: "Get in touch",
      eyebrow: "Software engineer · Builder",
      lead: "I design and build products end to end — from edge infrastructure to the last pixel — and write about what I learn along the way.",
      title: "Fast, careful software for the open web.",
      workCta: "See the work",
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
      lead: "Orkide is this site and the template every product I build starts from: a production-grade Cloudflare monorepo, typed end to end and open source.",
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
          value: "31",
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
      ],
      title: "Orkide’den bir ürün başlat",
      url: "https://github.com/Ouzx/orkide",
    },
    hero: {
      contactCta: "İletişime geç",
      eyebrow: "Yazılım mühendisi · Üretici",
      lead: "Ürünleri uçtan uca tasarlayıp geliştiriyorum — uç altyapıdan son piksele kadar — ve yol boyunca öğrendiklerimi yazıyorum.",
      title: "Açık web için hızlı ve özenli yazılım.",
      workCta: "İşleri gör",
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
      lead: "Orkide hem bu site hem de geliştirdiğim her ürünün başladığı şablon: üretim kalitesinde, uçtan uca tipli ve açık kaynak bir Cloudflare monoreposu.",
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
          value: "31",
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

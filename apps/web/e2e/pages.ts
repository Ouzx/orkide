/** Public pages and the admin sign-in, as served by the local build. */
export const pages = [
  { name: "home (en)", path: "/en" },
  { name: "home (tr)", path: "/tr" },
  { name: "blog index", path: "/en/blog" },
  { name: "blog post", path: "/en/blog/edge-first-architecture" },
  { name: "blog post (tr)", path: "/tr/blog/uc-oncelikli-mimari" },
  { name: "contact", path: "/en/contact" },
  { name: "portfolio", path: "/en/portfolio" },
  { name: "404", path: "/en/this-page-does-not-exist" },
  { name: "admin sign-in", path: "/en/admin" },
] as const;

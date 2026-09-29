export const site = {
  name: "Petalpost",
  wordmark: "petalpost",
  tagline: "Digital flower bouquets that never wilt",
  description:
    "Petalpost is a free digital flower bouquet maker. Arrange hand-drawn flowers, write a note, and send your bouquet as a link that blooms open on any phone. No signup, no app.",
  /** One-sentence entity definition, reused verbatim across the site, llms.txt and JSON-LD. */
  definition:
    "Petalpost is a free online tool for making and sending digital flower bouquets with a personal note, shared as a link.",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "https://flower-bouquet-digital.vercel.app").replace(/\/$/, ""),
  locale: "en",
  themeColor: "#FBF6EE",
} as const;

export const absoluteUrl = (path = "/") => `${site.url}${path.startsWith("/") ? path : `/${path}`}`;

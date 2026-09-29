import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

const PRIVATE = ["/b/", "/api/", "/garden", "/auth/", "/account/"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: PRIVATE },
      // Explicitly welcome AI search and answer engines (GEO).
      {
        userAgent: ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-User", "Claude-SearchBot", "PerplexityBot", "Perplexity-User", "Google-Extended", "Applebot-Extended", "Bingbot", "CCBot"],
        allow: "/",
        disallow: PRIVATE,
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: absoluteUrl("/"),
  };
}

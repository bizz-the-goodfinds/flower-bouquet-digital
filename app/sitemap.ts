import type { MetadataRoute } from "next";
import { FLOWER_FAMILIES } from "@/lib/content/flowers";
import { GUIDES } from "@/lib/content/guides";
import { OCCASIONS } from "@/lib/content/occasions";
import { absoluteUrl } from "@/lib/site";

const UPDATED = new Date("2026-09-29");

export default function sitemap(): MetadataRoute.Sitemap {
  const page = (path: string, priority: number, changeFrequency: "weekly" | "monthly" | "yearly" = "monthly") => ({
    url: absoluteUrl(path),
    lastModified: UPDATED,
    changeFrequency,
    priority,
  });
  return [
    page("/", 1, "weekly"),
    page("/create", 0.9, "weekly"),
    page("/occasions", 0.8),
    page("/flowers", 0.8),
    page("/guides", 0.6),
    page("/faq", 0.6),
    page("/about", 0.4, "yearly"),
    page("/privacy", 0.2, "yearly"),
    page("/terms", 0.2, "yearly"),
    ...OCCASIONS.map((o) => page(`/occasions/${o.slug}`, 0.8)),
    ...FLOWER_FAMILIES.map((f) => page(`/flowers/${f.slug}`, 0.7)),
    ...GUIDES.map((g) => page(`/guides/${g.slug}`, 0.7)),
  ];
}

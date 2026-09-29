import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${site.name} – Digital Flower Bouquets`,
    short_name: site.name,
    description: site.description,
    start_url: "/create",
    display: "standalone",
    background_color: "#FBF6EE",
    theme_color: "#FBF6EE",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}

"use client";

import { STEM_BY_SLUG } from "@/lib/bouquet/catalog";
import { stemArt } from "@/lib/bouquet/composition";

export function StemThumbClient({ slug, className = "size-12" }: { slug: string; className?: string }) {
  const def = STEM_BY_SLUG.get(slug);
  if (!def) return null;
  return (
    <svg
      viewBox={def.thumbViewBox}
      className={className}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: stemArt(slug, def.kind === "greenery" ? 420 : undefined) }}
    />
  );
}

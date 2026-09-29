"use client";

import { useEffect } from "react";
import { useReportWebVitals } from "next/web-vitals";
import { track } from "@/lib/analytics/track";

type Params = Record<string, string | number | boolean | undefined>;

/** `data-track-some-thing="x"` on an element becomes `{ some_thing: "x" }`. */
function paramsOf(el: HTMLElement): Params {
  const out: Params = {};
  for (const [k, v] of Object.entries(el.dataset)) {
    if (k.startsWith("track") && k.length > 5 && v !== undefined) out[k.slice(5).replace(/[A-Z]/g, (c, i) => (i ? "_" : "") + c.toLowerCase())] = v.slice(0, 100);
  }
  return out;
}

function placementOf(el: Element) {
  if (el.closest("nav[aria-label='Mobile']")) return "mobile_menu";
  if (el.closest("nav[aria-label='Breadcrumb']")) return "breadcrumb";
  if (el.closest("header")) return "header";
  if (el.closest("footer")) return "footer";
  const section = el.closest("section");
  return section?.querySelector("h2[id]")?.id ?? (section?.querySelector("h1") ? "hero" : "main");
}

const CONTENT = /^\/(occasions|flowers|guides)\/([^/?#]+)/;

const reportVital = (m: { name: string; value: number; rating?: string }) =>
  track("web_vitals", {
    metric_name: m.name,
    // CLS is unitless and tiny; scale it so GA can aggregate integers.
    metric_value: Math.round(m.name === "CLS" ? m.value * 1000 : m.value),
    rating: m.rating,
    page_path: location.pathname,
  });

/**
 * Site-wide tracking without wiring every component:
 * - any element with `data-track="event_name"` (+ `data-track-*` params) fires on click, or on open for <details>
 * - links into the maker fire `cta_clicked`, header/footer/menu links fire `nav_clicked`
 * - links to occasion, flower and guide pages fire GA's `select_content`
 * - Core Web Vitals per page
 */
export function AnalyticsListeners() {
  useReportWebVitals(reportVital);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target as Element | null;
      if (!target?.closest) return;
      const tagged = target.closest<HTMLElement>("[data-track]");
      if (tagged && tagged.tagName !== "DETAILS") track(tagged.dataset.track!, { ...paramsOf(tagged), page_path: location.pathname });

      const a = target.closest<HTMLAnchorElement>("a[href]");
      if (!a || tagged?.contains(a) || a.origin !== location.origin) return;
      const dest = a.pathname;
      const placement = placementOf(a);
      const text = (a.getAttribute("aria-label") || a.textContent || "").trim().slice(0, 60);
      if (dest === "/create") {
        track("cta_clicked", { cta_text: text, placement, destination: dest + a.search, page_path: location.pathname });
        return;
      }
      const content = CONTENT.exec(dest);
      if (content) track("select_content", { content_type: content[1].replace(/s$/, ""), item_id: content[2], placement, page_path: location.pathname });
      else if (placement === "header" || placement === "footer" || placement === "mobile_menu" || placement === "breadcrumb")
        track("nav_clicked", { destination: dest, link_text: text, placement, page_path: location.pathname });
    };
    // `toggle` doesn't bubble, so listen in the capture phase.
    const onToggle = (e: Event) => {
      const d = e.target;
      if (d instanceof HTMLDetailsElement && d.open && d.dataset.track) track(d.dataset.track, { ...paramsOf(d), page_path: location.pathname });
    };
    document.addEventListener("click", onClick, true);
    document.addEventListener("toggle", onToggle, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("toggle", onToggle, true);
    };
  }, []);

  return null;
}

/** Fire one event when a (server-rendered) page mounts. */
export function TrackOnMount({ name, params }: { name: string; params?: Params }) {
  useEffect(() => {
    track(name, { ...params, page_path: location.pathname });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name]);
  return null;
}

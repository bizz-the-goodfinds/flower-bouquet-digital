"use client";

import { useState } from "react";
import { StemThumbClient } from "@/components/bouquet/stem-thumb";
import { BACKGROUNDS, RIBBONS, STEMS, WRAPPERS } from "@/lib/bouquet/catalog";
import { MAX_STEMS } from "@/lib/bouquet/composition";
import { useBuilder } from "@/lib/bouquet/store";
import { track } from "@/lib/analytics/track";

const TABS = [
  { id: "flowers", label: "Flowers" },
  { id: "extras", label: "Fillers & greens" },
  { id: "wrap", label: "Wrap" },
  { id: "ribbon", label: "Ribbon" },
  { id: "bg", label: "Background" },
] as const;

type Tab = (typeof TABS)[number]["id"];

export function Tray() {
  const [tab, setTab] = useState<Tab>("flowers");
  const count = useBuilder((s) => s.design.items.length);
  const design = useBuilder((s) => s.design);
  const addStem = useBuilder((s) => s.addStem);
  const commit = useBuilder((s) => s.commit);
  const full = count >= MAX_STEMS;

  const stems = STEMS.filter((s) => (tab === "flowers" ? s.kind === "flower" : s.kind !== "flower"));

  return (
    <div className="rounded-[1.5rem] border border-line bg-paper">
      <div role="tablist" aria-label="Bouquet parts" className="no-scrollbar flex gap-1 overflow-x-auto border-b border-line p-2 lg:flex-wrap">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`min-h-11 shrink-0 rounded-full px-3.5 text-sm font-medium transition ${tab === t.id ? "bg-ink text-cream" : "text-ink-soft hover:bg-ink/5"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div role="tabpanel" className="p-3">
        {(tab === "flowers" || tab === "extras") && (
          <>
            <p className="mb-2 flex items-center justify-between px-1 text-xs text-ink-soft">
              <span>Tap to add · drag on the bouquet to move</span>
              <span className={`font-mono ${full ? "text-petal-deep" : ""}`}>
                {count}/{MAX_STEMS}
              </span>
            </p>
            <ul className="grid grid-cols-3 gap-1.5 min-[420px]:grid-cols-4 sm:grid-cols-5 lg:max-h-[calc(100dvh-16rem)] lg:grid-cols-3 lg:overflow-y-auto lg:pr-1 xl:grid-cols-4">
              {stems.map((s) => (
                <li key={s.slug}>
                  <button
                    disabled={full}
                    onClick={() => {
                      addStem(s.slug);
                      track("flower_added", { flower_slug: s.slug, count: count + 1 });
                    }}
                    title={`${s.name}: ${s.meaning}`}
                    className="group flex w-full flex-col items-center rounded-2xl border border-transparent p-2 text-center transition hover:border-line hover:bg-cream active:scale-95 disabled:opacity-40"
                  >
                    <StemThumbClient slug={s.slug} className="size-14 transition group-hover:-rotate-6 group-hover:scale-110" />
                    <span className="mt-1 text-[13px] leading-tight font-medium">{s.name}</span>
                    <span className="text-[11px] leading-tight text-ink-soft">{s.meaning}</span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}

        {tab === "wrap" && (
          <Swatches
            options={Object.entries(WRAPPERS).map(([k, w]) => ({ key: k, name: w.name, fill: w.paper, ring: w.shade }))}
            value={design.wrapper}
            onPick={(k) => commit((d) => ({ ...d, wrapper: k }))}
          />
        )}
        {tab === "ribbon" && (
          <Swatches
            options={Object.entries(RIBBONS).map(([k, r]) => ({ key: k, name: r.name, fill: r.color, ring: r.dark }))}
            value={design.ribbon}
            onPick={(k) => commit((d) => ({ ...d, ribbon: k }))}
          />
        )}
        {tab === "bg" && (
          <Swatches
            options={Object.entries(BACKGROUNDS).map(([k, b]) => ({ key: k, name: b.name, fill: b.fill, ring: "#E6DDCD" }))}
            value={design.background}
            onPick={(k) => commit((d) => ({ ...d, background: k }))}
          />
        )}
      </div>
    </div>
  );
}

function Swatches({
  options,
  value,
  onPick,
}: {
  options: { key: string; name: string; fill: string; ring: string }[];
  value: string;
  onPick: (k: string) => void;
}) {
  return (
    <div role="radiogroup" className="grid grid-cols-4 gap-3 p-1 sm:grid-cols-5 lg:grid-cols-4">
      {options.map((o) => (
        <button
          key={o.key}
          role="radio"
          aria-checked={value === o.key}
          onClick={() => onPick(o.key)}
          className="flex flex-col items-center gap-1.5 rounded-xl p-1.5 text-xs transition hover:bg-cream"
        >
          <span
            className={`block size-12 rounded-full border-2 transition ${value === o.key ? "scale-110 border-ink shadow-[2px_2px_0_0_var(--color-ink)]" : "border-transparent"}`}
            style={{ background: `radial-gradient(circle at 35% 30%, ${o.fill} 55%, ${o.ring})` }}
          />
          {o.name}
        </button>
      ))}
    </div>
  );
}

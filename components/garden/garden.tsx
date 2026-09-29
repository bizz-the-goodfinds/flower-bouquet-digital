"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Copy, Eye, Trash2 } from "lucide-react";
import { BouquetSvg } from "@/components/bouquet/bouquet-svg";
import { removeMine, useMine, type MineEntry } from "@/lib/local";

type Stats = { slug: string; views: number; deleted: boolean; reactions: { emoji: string; reply: string | null; created_at: string }[] };

export function Garden() {
  const mine = useMine();
  const [stats, setStats] = useState<Record<string, Stats>>({});
  const slugs = mine?.map((m) => m.slug).join(",");

  useEffect(() => {
    if (!mine?.length) return;
    fetch("/api/bouquets/mine", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: mine.map((m) => ({ slug: m.slug, token: m.token })) }),
    })
      .then((r) => (r.ok ? r.json() : { bouquets: [] }))
      .then((d: { bouquets: Stats[] }) => setStats(Object.fromEntries(d.bouquets.map((b) => [b.slug, b]))))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slugs]);

  if (mine === null) return <div className="mt-10 h-40 animate-pulse rounded-[var(--radius-card)] bg-paper" />;

  if (!mine.length)
    return (
      <div className="mt-10 rounded-[var(--radius-card)] border border-dashed border-line bg-paper p-10 text-center">
        <p className="font-display text-3xl">Your garden is empty 🌱</p>
        <p className="mt-2 text-ink/70">Bouquets you send will show up here.</p>
        <Link href="/create" className="btn-primary mt-6">
          Make your first bouquet
        </Link>
      </div>
    );

  const remove = async (m: MineEntry) => {
    if (!window.confirm(`Delete the bouquet for ${m.to || "them"}? The link will stop working. This can't be undone.`)) return;
    const res = await fetch(`/api/bouquets/${m.slug}`, { method: "DELETE", headers: { "x-edit-token": m.token } });
    if (res.ok || res.status === 404) removeMine(m.slug);
  };

  return (
    <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {mine.map((m) => {
        const s = stats[m.slug];
        if (s?.deleted) return null;
        return (
          <li key={m.slug} className="flex flex-col rounded-[var(--radius-card)] border border-line bg-paper p-4">
            <div className="flex gap-4">
              <BouquetSvg design={m.design} className="w-24 shrink-0 rounded-xl" label={`Bouquet for ${m.to || "someone"}`} />
              <div className="min-w-0 flex-1">
                <p className="font-display text-2xl leading-tight" data-clarity-mask="true">
                  for {m.to || "someone"}
                </p>
                <p className="mt-1 text-sm text-ink-soft">{new Date(m.createdAt).toLocaleDateString(undefined, { dateStyle: "medium" })}</p>
                <p className="mt-2 flex items-center gap-1.5 text-sm">
                  <Eye className="size-4" aria-hidden /> {s ? `${s.views} ${s.views === 1 ? "open" : "opens"}` : "…"}
                </p>
              </div>
            </div>
            {s && s.reactions.length > 0 && (
              <ul className="mt-3 space-y-1.5 border-t border-line pt-3 text-sm" data-clarity-mask="true">
                {s.reactions.slice(0, 3).map((r) => (
                  <li key={r.created_at} className="flex gap-2">
                    <span className="text-lg leading-none">{r.emoji}</span>
                    <span className="text-ink/80">{r.reply}</span>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-auto flex gap-1 pt-4">
              <Link href={`/b/${m.slug}`} className="btn-ghost border border-line !py-1.5 text-sm">
                Open
              </Link>
              <button
                className="btn-ghost border border-line !py-1.5 text-sm"
                onClick={() => navigator.clipboard?.writeText(`${window.location.origin}/b/${m.slug}`)}
              >
                <Copy className="size-3.5" aria-hidden /> Copy link
              </button>
              <button className="btn-ghost ml-auto !py-1.5 text-sm text-petal-deep" onClick={() => remove(m)} aria-label={`Delete bouquet for ${m.to || "someone"}`}>
                <Trash2 className="size-4" aria-hidden />
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

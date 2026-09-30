"use client";

import { useEffect, useState } from "react";
import {
  ChevronDown,
  Download,
  Eye,
  Flame,
  Flower2,
  Sprout,
} from "lucide-react";
import { Sheet } from "@/components/ui/sheet";
import { Tooltip } from "@/components/ui/tooltip";
import { MiniBloom } from "@/components/ui/bloom-loader";
import {
  BADGES,
  BADGE_BY_ID,
  type Badge,
  type BadgeId,
  type GardenStats,
} from "@/lib/garden/badges";
import { getMine } from "@/lib/local";
import { track } from "@/lib/analytics/track";

const LOCAL_KEY = "pp-badges-v1";
const OPEN_KEY = "pp-garden-open-v1";
type Local = { earned: Record<string, string>; celebrated: string[] };

function readLocal(): Local | null {
  try {
    const v = JSON.parse(localStorage.getItem(LOCAL_KEY) ?? "null");
    return v && typeof v === "object"
      ? { earned: v.earned ?? {}, celebrated: v.celebrated ?? [] }
      : null;
  } catch {
    return null;
  }
}
const writeLocal = (v: Local) => {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(v));
  } catch {}
};

/**
 * "Your garden": weekly streak, totals, referral stats and badges at the top of My bouquets.
 * Works from this device's bouquets without an account; an account adds its bouquets and keeps badge dates across devices.
 */
export function GardenStatsStrip({ refreshKey }: { refreshKey: string }) {
  const [stats, setStats] = useState<GardenStats | null>(null);
  const [earned, setEarned] = useState<Record<string, string>>({});
  const [celebrate, setCelebrate] = useState<Badge | null>(null);
  // Collapsed by default; remembers if they open it.
  const [open, setOpenState] = useState(() => {
    try {
      return (
        typeof window !== "undefined" && localStorage.getItem(OPEN_KEY) === "1"
      );
    } catch {
      return false;
    }
  });
  const setOpen = (v: boolean) => {
    setOpenState(v);
    track("garden_stats_toggled", { open: v });
    try {
      if (v) localStorage.setItem(OPEN_KEY, "1");
      else localStorage.removeItem(OPEN_KEY);
    } catch {}
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/garden/stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: getMine().map((m) => ({ slug: m.slug, token: m.token })),
        }),
      }).catch(() => null);
      if (!res?.ok || cancelled) return;
      const data = (await res.json()) as {
        stats: GardenStats;
        earned: BadgeId[];
        earnedAt: Record<string, string>;
      };
      const prev = readLocal();
      const now = new Date().toISOString();
      const dates: Record<string, string> = {};
      for (const id of data.earned)
        dates[id] = data.earnedAt[id] ?? prev?.earned[id] ?? now;
      // Someone with a history seeing badges for the first time: don't throw a party for every old one.
      const quiet = !prev && data.stats.sent > 1;
      const celebrated = quiet ? [...data.earned] : (prev?.celebrated ?? []);
      writeLocal({ earned: { ...prev?.earned, ...dates }, celebrated });
      setStats(data.stats);
      setEarned(dates);
      const fresh = data.earned.find((id) => !celebrated.includes(id));
      if (fresh) setCelebrate(BADGE_BY_ID.get(fresh) ?? null);
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  if (!stats || stats.sent === 0) return null;

  const closeCelebration = () => {
    if (!celebrate) return;
    const local = readLocal() ?? { earned: {}, celebrated: [] };
    writeLocal({
      ...local,
      celebrated: [...new Set([...local.celebrated, celebrate.id])],
    });
    // Next one in line, if several were earned at once.
    const next = Object.keys(earned).find(
      (id) => id !== celebrate.id && !local.celebrated.includes(id),
    );
    setCelebrate(next ? (BADGE_BY_ID.get(next as BadgeId) ?? null) : null);
  };

  const tiles = [
    {
      icon: <Flame className="size-4 text-tomato" aria-hidden />,
      value: stats.streak,
      label: "week streak",
      hint:
        stats.streak > 0 && !stats.sentThisWeek
          ? "Send one this week to keep it going"
          : stats.bestStreak > stats.streak
            ? `Best: ${stats.bestStreak} weeks`
            : "Weeks in a row you sent flowers",
    },
    {
      icon: <Flower2 className="size-4" aria-hidden />,
      value: stats.sent,
      label: "sent",
      hint: "Bouquets you've sent",
    },
    {
      icon: <Eye className="size-4" aria-hidden />,
      value: stats.opens,
      label: stats.opens === 1 ? "open" : "opens",
      hint: "Times your bouquets were opened",
    },
    {
      icon: <Sprout className="size-4 text-sage-deep" aria-hidden />,
      value: stats.referrals,
      label: "inspired",
      hint: stats.referrals
        ? `${stats.referrals} ${stats.referrals === 1 ? "person" : "people"} sent a bouquet after opening one of yours`
        : "People who send flowers after opening yours show up here",
    },
  ];

  return (
    <section
      aria-labelledby="garden-stats"
      className="mt-4 rounded-[var(--radius-card)] border-[1.5px] border-ink bg-paper shadow-[3px_3px_0_0_var(--color-ink)]"
    >
      <h2 id="garden-stats">
        <button
          type="button"
          aria-expanded={open}
          aria-controls="garden-stats-body"
          onClick={() => setOpen(!open)}
          className="flex min-h-14 w-full items-center gap-3 px-4 py-2.5 text-left sm:px-5"
        >
          <span className="label shrink-0 !text-ink">Your garden</span>
          <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-ink-soft">
            <span className="flex items-center gap-1">
              <Flame className="size-3.5 text-tomato" aria-hidden />{" "}
              {stats.streak} wk
            </span>
            <span className="flex items-center gap-1">
              <Flower2 className="size-3.5" aria-hidden /> {stats.sent}
            </span>
            <span className="hidden items-center gap-1 min-[380px]:flex">
              <span aria-hidden>🏅</span> {Object.keys(earned).length}/
              {BADGES.length}
            </span>
          </span>
          <ChevronDown
            className={`size-5 shrink-0 transition ${open ? "rotate-180" : ""}`}
            aria-hidden
          />
          <span className="sr-only">
            {open ? "Hide" : "Show"} streak, stats and badges
          </span>
        </button>
      </h2>
      <div
        id="garden-stats-body"
        hidden={!open}
        className="border-t border-line px-4 pt-3 pb-4 sm:px-5"
      >
        <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {tiles.map((t) => (
            <div
              key={t.label}
              className="rounded-2xl bg-cream px-3 py-2.5"
              title={t.hint}
            >
              <dt className="flex items-center gap-1.5 text-xs text-ink-soft">
                {t.icon} {t.label}
              </dt>
              <dd className="font-display text-3xl leading-tight">{t.value}</dd>
              <dd className="text-[11px] leading-snug text-ink-soft">
                {t.hint}
              </dd>
            </div>
          ))}
        </dl>
        <ul
          className="no-scrollbar -mx-1 mt-4 flex gap-2 overflow-x-auto px-1 pb-1"
          aria-label="Badges"
        >
          {BADGES.map((b) => {
            const on = Boolean(earned[b.id]);
            return (
              <li key={b.id} className="shrink-0">
                <Tooltip
                  label={
                    on
                      ? `${b.name}: earned ${new Date(earned[b.id]).toLocaleDateString(undefined, { dateStyle: "medium" })}`
                      : b.hint
                  }
                >
                  <button
                    type="button"
                    onClick={() => on && setCelebrate(b)}
                    aria-label={
                      on
                        ? `${b.name} badge, earned. Share it`
                        : `${b.name} badge, locked: ${b.hint}`
                    }
                    className={`flex min-h-11 items-center gap-1.5 rounded-full border-[1.5px] px-3 text-sm transition ${on ? "border-ink bg-butter/60 font-medium hover:-translate-y-0.5" : "cursor-default border-dashed border-line text-ink-soft"}`}
                  >
                    <span
                      aria-hidden
                      className={on ? "" : "opacity-40 grayscale"}
                    >
                      {b.emoji}
                    </span>
                    {b.name}
                  </button>
                </Tooltip>
              </li>
            );
          })}
        </ul>
      </div>
      {celebrate && (
        <Celebration badge={celebrate} onClose={closeCelebration} />
      )}
    </section>
  );
}

function Celebration({
  badge,
  onClose,
}: {
  badge: Badge;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false);
  useEffect(() => track("badge_earned_shown", { badge: badge.id }), [badge.id]);
  return (
    <Sheet title="New badge!" onClose={onClose}>
      <div className="text-center">
        <div
          aria-hidden
          className="relative mx-auto grid size-36 place-items-center"
        >
          {Array.from({ length: 10 }, (_, i) => (
            <span
              key={i}
              className="pp-confetti absolute size-2.5 rounded-sm"
              style={{
                background: [
                  "#F4A6C0",
                  "#F7DE8A",
                  "#C9B8F2",
                  "#9DB59A",
                  "#E8553E",
                ][i % 5],
                transform: `rotate(${i * 36}deg) translateY(-64px)`,
                animationDelay: `${i * 40}ms`,
              }}
            />
          ))}
          <span className="grid size-28 place-items-center rounded-full border-[1.5px] border-ink bg-butter text-6xl shadow-[4px_4px_0_0_var(--color-ink)]">
            {badge.emoji}
          </span>
        </div>
        <p className="mt-4 font-display text-4xl">{badge.name}</p>
        <p className="mt-1 text-ink/70">{badge.done} 🎉</p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <button
            type="button"
            className="btn-primary"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                const { renderBadgePng } =
                  await import("@/lib/garden/badge-image");
                const { saveImage } = await import("@/lib/bouquet/export");
                await saveImage(
                  await renderBadgePng(badge),
                  `badge-${badge.id}.png`,
                );
                track("badge_shared", { badge: badge.id });
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? (
              <MiniBloom className="size-4" />
            ) : (
              <Download className="size-4" aria-hidden />
            )}{" "}
            Save & share
          </button>
          <button
            type="button"
            className="btn-ghost border border-line"
            onClick={onClose}
          >
            Nice!
          </button>
        </div>
      </div>
    </Sheet>
  );
}

"use client";

import { useState } from "react";
import { Check, Copy, Plus, Send, Trash2, Users } from "lucide-react";
import { MiniBloom } from "@/components/ui/bloom-loader";
import { track } from "@/lib/analytics/track";

export type PersonalLink = { key: string; name: string; views: number | null; openedAt: string | null };

/**
 * One bouquet, several people: each person gets their own link, so the sender sees who opened it
 * and chats with each of them separately.
 */
export function PersonalLinks({
  slug,
  token,
  links: initial,
  onChange,
  defaultOpen = false,
}: {
  slug: string;
  token: string | null;
  links: PersonalLink[];
  onChange?: (links: PersonalLink[]) => void;
  defaultOpen?: boolean;
}) {
  const [links, setLinksState] = useState(initial);
  const [open, setOpen] = useState(defaultOpen || initial.length > 0);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const headers = { "Content-Type": "application/json", ...(token ? { "x-edit-token": token } : {}) };
  const url = (key: string) => `${window.location.origin}/b/${slug}?r=${key}`;

  const setLinks = (next: PersonalLink[]) => {
    setLinksState(next);
    onChange?.(next);
  };

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/bouquets/${slug}/links`, { method: "POST", headers, body: JSON.stringify({ name: name.trim() }) }).catch(() => null);
    const data = await res?.json().catch(() => ({}));
    setBusy(false);
    if (!res?.ok) return setError(data?.error ?? "Couldn't make that link. Try again.");
    setLinks([...links, data as PersonalLink]);
    setName("");
    track("personal_link_created", { count: links.length + 1 });
  };

  const remove = async (key: string) => {
    const res = await fetch(`/api/bouquets/${slug}/links?key=${key}`, { method: "DELETE", headers }).catch(() => null);
    if (res?.ok) setLinks(links.filter((l) => l.key !== key));
  };

  const copy = async (key: string) => {
    await navigator.clipboard?.writeText(url(key)).catch(() => {});
    setCopied(key);
    setTimeout(() => setCopied((c) => (c === key ? null : c)), 1600);
    track("share_clicked", { channel: "personal_copy" });
  };

  const share = async (l: PersonalLink) => {
    const text = `${l.name}, I sealed something for you 💌`;
    if ("share" in navigator) {
      try {
        await navigator.share({ title: "Something special for you", text, url: url(l.key) });
        track("share_clicked", { channel: "personal_native" });
        return;
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
      }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(`${text} ${url(l.key)}`)}`, "_blank", "noopener");
    track("share_clicked", { channel: "personal_whatsapp" });
  };

  if (!open)
    return (
      <button type="button" onClick={() => setOpen(true)} className="flex w-full items-center gap-3 rounded-2xl border border-dashed border-line bg-paper px-4 py-3 text-left text-sm transition hover:border-ink">
        <Users className="size-5 shrink-0" aria-hidden />
        <span>
          <strong className="font-medium">Sending to more than one person?</strong>
          <span className="block text-ink-soft">Give each one their own link to see who opened it and chat with each separately.</span>
        </span>
      </button>
    );

  return (
    <div className="rounded-2xl border border-line bg-paper p-4 text-left">
      <p className="flex items-center gap-2 text-sm font-medium">
        <Users className="size-4" aria-hidden /> Personal links
      </p>
      <p className="mt-1 text-xs text-ink-soft">Each person sees their own name on the envelope. Opens and chats stay separate.</p>
      {links.length > 0 && (
        <ul className="mt-3 divide-y divide-line">
          {links.map((l) => (
            <li key={l.key} className="flex items-center gap-2 py-2">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium" data-clarity-mask="true">
                  {l.name}
                </span>
                <span className="text-xs text-ink-soft">{l.openedAt ? `Opened · ${l.views} ${l.views === 1 ? "open" : "opens"}` : "Not opened yet"}</span>
              </span>
              <button type="button" className="btn-ghost min-h-10 !px-2.5 !py-1 text-xs" onClick={() => copy(l.key)} aria-label={`Copy link for ${l.name}`}>
                {copied === l.key ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
              </button>
              <button type="button" className="btn-ghost min-h-10 !px-2.5 !py-1 text-xs" onClick={() => share(l)} aria-label={`Send link to ${l.name}`}>
                <Send className="size-4" aria-hidden />
              </button>
              <button type="button" className="btn-ghost min-h-10 !px-2.5 !py-1 text-xs text-petal-deep" onClick={() => remove(l.key)} aria-label={`Delete link for ${l.name}`}>
                <Trash2 className="size-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={add} className="mt-3 flex gap-2">
        <input className="field !py-2" maxLength={60} placeholder="Their name, e.g. Sam" value={name} onChange={(e) => setName(e.target.value)} aria-label="Recipient name" data-clarity-mask="true" />
        <button className="btn-primary shrink-0 !px-3.5 !py-2 text-sm" disabled={busy || !name.trim()}>
          {busy ? <MiniBloom /> : <Plus className="size-4" aria-hidden />} Add
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-petal-deep">{error}</p>}
    </div>
  );
}

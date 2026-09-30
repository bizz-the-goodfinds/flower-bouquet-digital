"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, ExternalLink, KeyRound, LogIn, RefreshCw, Scissors, Settings2, Smile, Sparkles, Unplug } from "lucide-react";
import { Sheet } from "@/components/ui/sheet";
import { MiniBloom } from "@/components/ui/bloom-loader";
import { AiError, PROVIDERS, PROVIDER_ORDER, TONES, startOpenRouterSignIn, testConnection, writeDrafts, type ProviderId, type Tone, type Tweak } from "@/lib/ai/providers";
import { disconnect, saveConnection, setModel, useConnection } from "@/lib/ai/key";
import { OCCASION_BY_SLUG } from "@/lib/content/occasions";
import { useBuilder } from "@/lib/bouquet/store";
import { track } from "@/lib/analytics/track";

export const AI_GUIDE_PATH = "/guides/ai-note-writer-api-key";

/** "Help me write" on the Write step: opens the note writer, or its setup when no AI account is connected yet. */
export function NoteWriterButton({ startOpen = false }: { startOpen?: boolean }) {
  const [open, setOpen] = useState(startOpen);
  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          track("ai_writer_opened");
        }}
        className="inline-flex min-h-9 items-center gap-1.5 rounded-full border-[1.5px] border-ink bg-butter/70 px-3 text-sm font-medium shadow-[2px_2px_0_0_var(--color-ink)] transition hover:-translate-y-0.5"
      >
        <Sparkles className="size-4" aria-hidden /> Help me write
      </button>
      {open && <NoteWriter onClose={() => setOpen(false)} />}
    </>
  );
}

function NoteWriter({ onClose }: { onClose: () => void }) {
  const conn = useConnection();
  const [setup, setSetup] = useState(false);
  const showSetup = !conn || setup;
  return (
    <Sheet title={showSetup ? "Connect your AI" : "Help me write ✨"} onClose={onClose} wide>
      {showSetup ? <Setup onDone={() => setSetup(false)} canGoBack={Boolean(conn)} /> : <Writer onClose={onClose} onSettings={() => setSetup(true)} />}
    </Sheet>
  );
}

// ---------- Setup ----------

function Setup({ onDone, canGoBack }: { onDone: () => void; canGoBack: boolean }) {
  const [provider, setProvider] = useState<ProviderId>("gemini");
  const [key, setKey] = useState("");
  const [remember, setRemember] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const p = PROVIDERS[provider];
  useEffect(() => track("ai_setup_started"), []);

  const connect = async (e: React.FormEvent) => {
    e.preventDefault();
    // React events bubble through portals: keep this submit away from the Write step's own form.
    e.stopPropagation();
    const k = key.trim();
    if (!k) return;
    setError(null);
    setTesting(true);
    try {
      const c = { provider, key: k, model: p.defaultModel };
      await testConnection(c);
      saveConnection(c, { remember, method: "paste" });
      track("ai_key_connected", { provider, method: "paste", remember });
      setKey("");
      onDone();
    } catch (err) {
      setError(err instanceof AiError ? err.message : "That key didn't work. Try again.");
      track("ai_key_failed", { provider, reason: err instanceof AiError ? err.code : "unknown" });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-5">
      {canGoBack && (
        <button type="button" className="btn-ghost -ml-2 !px-2 text-sm" onClick={onDone}>
          <ArrowLeft className="size-4" aria-hidden /> Back to writing
        </button>
      )}
      <p className="text-[15px] leading-relaxed text-ink/80">
        The writer uses <strong>your own</strong> AI account, so it&rsquo;s private and we never pay for or see it. Your key stays in this browser and goes straight to the
        provider, never to our servers.
      </p>

      <div role="radiogroup" aria-label="AI provider" className="grid grid-cols-2 gap-2">
        {PROVIDER_ORDER.map((id) => {
          const on = id === provider;
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => {
                setProvider(id);
                setError(null);
              }}
              className={`rounded-2xl border-[1.5px] p-3 text-left transition ${on ? "border-ink bg-cream shadow-[2px_2px_0_0_var(--color-ink)]" : "border-line hover:border-ink/40"}`}
            >
              <span className="flex items-center justify-between gap-1">
                <span className="text-sm font-semibold">{PROVIDERS[id].aka}</span>
                {PROVIDERS[id].free && <span className="rounded-full bg-sage/60 px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase">Free tier</span>}
                {id === "openrouter" && <span className="rounded-full bg-lilac/60 px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase">No copy-paste</span>}
              </span>
              <span className="mt-0.5 block text-xs text-ink-soft">{PROVIDERS[id].name}</span>
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl border border-line bg-cream/60 p-4 text-sm">
        <p className="font-medium">How to get a {p.name} key</p>
        <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-ink/80">
          {p.steps.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
        <p className="mt-3 text-ink/80">
          <span className="font-medium text-ink">Cost:</span> {p.cost}
        </p>
        <p className="mt-1.5 text-ink/80">
          <span className="font-medium text-ink">Spending limit:</span> {p.limitTip}
        </p>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
          {provider !== "openrouter" && (
            <a href={p.keyUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-9 items-center gap-1 font-medium underline underline-offset-2">
              Create a key <ExternalLink className="size-3.5" aria-hidden />
            </a>
          )}
          <a href={p.limitUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-9 items-center gap-1 underline underline-offset-2">
            Set a limit <ExternalLink className="size-3.5" aria-hidden />
          </a>
          <Link href={AI_GUIDE_PATH} target="_blank" className="inline-flex min-h-9 items-center gap-1 underline underline-offset-2">
            Full guide <ExternalLink className="size-3.5" aria-hidden />
          </Link>
        </div>
      </div>

      {provider === "openrouter" && (
        <div>
          <button
            type="button"
            className="btn-primary w-full"
            onClick={() => {
              track("ai_oauth_started", { provider: "openrouter" });
              void startOpenRouterSignIn();
            }}
          >
            <LogIn className="size-4" aria-hidden /> Sign in with OpenRouter
          </button>
          <p className="mt-2 text-center text-xs text-ink-soft">Your bouquet draft is saved. You&rsquo;ll come right back here.</p>
          <p className="label mt-4 text-center">or paste a key</p>
        </div>
      )}

      <form onSubmit={connect} className="space-y-3">
        <label className="block">
          <span className="label flex items-center gap-1.5">
            <KeyRound className="size-3.5" aria-hidden /> {p.name} API key
          </span>
          <input
            className="field mt-1.5 font-mono text-sm"
            type="password"
            autoComplete="off"
            spellCheck={false}
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder={p.keyPlaceholder}
            data-clarity-mask="true"
            data-clarity-unmask="false"
            aria-describedby="ai-key-note"
          />
        </label>
        {key.trim() && !p.keyPrefix.test(key.trim()) && <p className="text-xs text-ink-soft">That doesn&rsquo;t look like a {p.name} key, but we&rsquo;ll test it anyway.</p>}
        <label className="flex min-h-11 cursor-pointer items-center gap-2.5 text-sm">
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="size-4 accent-ink" />
          Remember on this device
        </label>
        <p id="ai-key-note" className="text-xs text-ink-soft">
          {remember ? "Kept in this browser until you disconnect." : "Forgotten when you close this tab."} Only use this on a device you trust.
        </p>
        {error && (
          <p role="alert" className="rounded-xl bg-petal/25 px-4 py-3 text-sm text-petal-deep">
            {error}
          </p>
        )}
        <button type="submit" className="btn-primary w-full" disabled={!key.trim() || testing}>
          {testing ? <MiniBloom /> : <Check className="size-4" aria-hidden />} {testing ? "Testing your key…" : "Test key & connect"}
        </button>
      </form>
    </div>
  );
}

// ---------- Writer ----------

function Writer({ onClose, onSettings }: { onClose: () => void; onSettings: () => void }) {
  const conn = useConnection()!;
  const card = useBuilder((s) => s.card);
  const occasion = useBuilder((s) => s.occasion);
  const [tone, setTone] = useState<Tone>("cute");
  const [details, setDetails] = useState("");
  const [drafts, setDrafts] = useState<string[]>([]);
  const [busy, setBusy] = useState<Tweak | "new" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [advanced, setAdvanced] = useState(false);
  const occasionName = occasion ? (OCCASION_BY_SLUG.get(occasion)?.name ?? null) : null;

  const run = async (tweak?: Tweak) => {
    setError(null);
    setBusy(tweak ?? "new");
    try {
      const next = await writeDrafts(conn, { tone, to: card.to, from: card.from, occasion: occasionName, details, tweak, previous: tweak ? drafts : undefined });
      setDrafts(next);
      track("ai_note_generated", { provider: conn.provider, tone, tweak: tweak ?? "none" });
    } catch (err) {
      const e = err instanceof AiError ? err : new AiError("provider_down", "Something went wrong. Try again.");
      setError(e.message);
      track("ai_note_failed", { provider: conn.provider, reason: e.code });
    } finally {
      setBusy(null);
    }
  };

  const use = (d: string) => {
    useBuilder.getState().setCard({ message: d });
    track("ai_note_used", { provider: conn.provider, tone });
    onClose();
  };

  return (
    <div className="space-y-5">
      <fieldset>
        <legend className="label mb-2">Tone</legend>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(TONES) as Tone[]).map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={tone === t}
              onClick={() => setTone(t)}
              className={`min-h-10 rounded-full border-[1.5px] px-3.5 text-sm transition ${tone === t ? "border-ink bg-ink text-cream" : "border-line bg-paper hover:border-ink/40"}`}
            >
              <span aria-hidden>{TONES[t].emoji}</span> {TONES[t].name}
            </button>
          ))}
        </div>
      </fieldset>

      <label className="block">
        <span className="label">A few details (optional)</span>
        <input
          className="field mt-1.5"
          value={details}
          maxLength={300}
          onChange={(e) => setDetails(e.target.value)}
          placeholder="we met at uni, she loves cats…"
          data-clarity-mask="true"
        />
        <span className="mt-1.5 block text-xs text-ink-soft">
          {[card.to && `To ${card.to}`, card.from && `from ${card.from}`, occasionName && `for ${occasionName.toLowerCase()}`].filter(Boolean).join(", ") || "Add their name on the card for a more personal note."}
        </span>
      </label>

      <button type="button" className="btn-primary w-full" onClick={() => run()} disabled={busy !== null}>
        {busy === "new" ? <MiniBloom /> : <Sparkles className="size-4" aria-hidden />} {busy === "new" ? "Writing…" : drafts.length ? "Write 3 new drafts" : "Write 3 drafts"}
      </button>

      {error && (
        <div role="alert" className="rounded-xl bg-petal/25 px-4 py-3 text-sm text-petal-deep">
          {error}{" "}
          {/key|credit/i.test(error) && (
            <button type="button" className="underline underline-offset-2" onClick={onSettings}>
              Check your AI connection
            </button>
          )}
        </div>
      )}

      {drafts.length > 0 && (
        <div className="space-y-2.5" aria-live="polite">
          <p className="label">Tap one to use it. You can edit it after.</p>
          {drafts.map((d, i) => (
            <button
              key={`${i}-${d.slice(0, 12)}`}
              type="button"
              onClick={() => use(d)}
              disabled={busy !== null}
              className="block w-full rounded-2xl border-[1.5px] border-line bg-cream/60 p-4 text-left text-[15px] leading-relaxed whitespace-pre-wrap transition hover:border-ink hover:shadow-[2px_2px_0_0_var(--color-ink)] disabled:opacity-50"
              data-clarity-mask="true"
            >
              {d}
            </button>
          ))}
          <div className="flex flex-wrap gap-2 pt-1">
            {(
              [
                ["shorter", "Shorter", Scissors],
                ["emoji", "More emoji", Smile],
                ["again", "Try again", RefreshCw],
              ] as const
            ).map(([t, label, Icon]) => (
              <button key={t} type="button" className="chip min-h-10 hover:border-ink" onClick={() => run(t)} disabled={busy !== null}>
                {busy === t ? <MiniBloom className="size-4" /> : <Icon className="size-4" aria-hidden />} {label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="border-t border-line pt-4 text-xs text-ink-soft">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span>
            Using <strong className="text-ink">{PROVIDERS[conn.provider].name}</strong> · {conn.remember ? "remembered on this device" : "this tab only"}
          </span>
          <span className="flex gap-1">
            <button type="button" className="btn-ghost min-h-9 !px-2 text-xs" onClick={() => setAdvanced((v) => !v)} aria-expanded={advanced}>
              <Settings2 className="size-3.5" aria-hidden /> Model
            </button>
            <button type="button" className="btn-ghost min-h-9 !px-2 text-xs" onClick={onSettings}>
              <KeyRound className="size-3.5" aria-hidden /> Change
            </button>
            <button
              type="button"
              className="btn-ghost min-h-9 !px-2 text-xs"
              onClick={() => {
                disconnect();
                track("ai_key_disconnected", { provider: conn.provider });
              }}
            >
              <Unplug className="size-3.5" aria-hidden /> Disconnect
            </button>
          </span>
        </div>
        {advanced && (
          <label className="mt-3 block">
            <span className="label">Model</span>
            <input
              className="field mt-1.5 font-mono text-sm"
              defaultValue={conn.model}
              spellCheck={false}
              onBlur={(e) => setModel(e.target.value.trim() || PROVIDERS[conn.provider].defaultModel)}
              placeholder={PROVIDERS[conn.provider].defaultModel}
            />
            <span className="mt-1 block">Default: {PROVIDERS[conn.provider].defaultModel}. Any model id your account can use works.</span>
          </label>
        )}
        <p className="mt-3">Your details and drafts go straight from this browser to {PROVIDERS[conn.provider].name}. Notes still follow our kindness rules when you send.</p>
      </div>
    </div>
  );
}

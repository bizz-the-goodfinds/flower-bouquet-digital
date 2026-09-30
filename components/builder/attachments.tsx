"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Music, Plus, RotateCcw, Square, Trash2 } from "lucide-react";
import { SongCard } from "@/components/bouquet/note-extras";
import { MiniBloom } from "@/components/ui/bloom-loader";
import { MAX_VOICE_SECONDS, fmtSeconds, parseSongUrl, type Song } from "@/lib/bouquet/media";
import { useBuilder } from "@/lib/bouquet/store";
import { track } from "@/lib/analytics/track";

/** Optional song link and voice note on the Write step. */
export function Attachments() {
  return (
    // min-w-0: a fieldset otherwise grows to its widest child (a long song title) and spills out of the column.
    <fieldset className="min-w-0 space-y-3">
      <legend className="label mb-2">
        Add a song or voice note <span className="normal-case tracking-normal">(optional)</span>
      </legend>
      <SongPicker />
      <VoiceRecorder />
    </fieldset>
  );
}

function SongPicker() {
  const song = useBuilder((s) => s.song);
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const add = async () => {
    setError(null);
    if (!parseSongUrl(url)) {
      setError("Paste a Spotify, YouTube or Apple Music link.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/song?url=${encodeURIComponent(url.trim())}`);
      const data = (await res.json().catch(() => ({}))) as { song?: Song; error?: string };
      if (!res.ok || !data.song) throw new Error(data.error ?? "Couldn't find that song.");
      useBuilder.getState().setMeta({ song: data.song });
      setUrl("");
      track("song_added", { provider: data.song.provider });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (song)
    return (
      <SongCard
        song={song}
        onRemove={() => {
          useBuilder.getState().setMeta({ song: null });
          track("song_removed");
        }}
      />
    );

  return (
    <div>
      <div className="flex gap-2">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Song link</span>
          <Music className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-soft" aria-hidden />
          <input
            className="field !pl-10"
            type="url"
            inputMode="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void add();
              }
            }}
            placeholder="Paste a Spotify, YouTube or Apple Music link"
          />
        </label>
        <button type="button" className="btn-secondary shrink-0 !px-4" onClick={add} disabled={!url.trim() || busy} aria-label="Add song">
          {busy ? <MiniBloom className="size-4" /> : <Plus className="size-4" aria-hidden />} <span className="hidden sm:inline">Add</span>
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-1.5 text-sm text-petal-deep">
          {error}
        </p>
      )}
    </div>
  );
}

/** Best format this browser can record: Opus in WebM (Chrome, Firefox, Android) or AAC in MP4 (Safari). */
function pickMime() {
  if (typeof MediaRecorder === "undefined") return null;
  for (const m of ["audio/webm;codecs=opus", "audio/webm", "audio/mp4;codecs=mp4a.40.2", "audio/mp4", "audio/ogg;codecs=opus"]) if (MediaRecorder.isTypeSupported(m)) return m;
  return "";
}

type Phase = "idle" | "asking" | "recording" | "uploading" | "error";

function VoiceRecorder() {
  const voice = useBuilder((s) => s.voice);
  const [phase, setPhase] = useState<Phase>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [localUrl, setLocalUrl] = useState<string | null>(null);
  const rec = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const started = useRef(0);
  const timer = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  /** A recording that failed to upload, kept for "Try again". */
  const [pending, setPending] = useState<{ blob: Blob; seconds: number } | null>(null);

  const cleanup = () => {
    clearInterval(timer.current);
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
  };
  useEffect(() => cleanup, []);
  useEffect(() => () => void (localUrl && URL.revokeObjectURL(localUrl)), [localUrl]);

  const upload = async (blob: Blob, seconds: number) => {
    setPhase("uploading");
    setError(null);
    setPending({ blob, seconds });
    try {
      const res = await fetch("/api/voice", { method: "POST", headers: { "Content-Type": blob.type || "audio/webm" }, body: blob });
      const data = (await res.json().catch(() => ({}))) as { path?: string; sig?: string; url?: string | null; error?: string };
      if (!res.ok || !data.path || !data.sig) throw new Error(data.error ?? "Couldn't save the recording.");
      useBuilder.getState().setMeta({ voice: { path: data.path, sig: data.sig, seconds, url: data.url ?? null } });
      setPending(null);
      setPhase("idle");
      track("voice_recorded", { seconds });
    } catch (err) {
      setError((err as Error).message);
      setPhase("error");
    }
  };

  const stop = () => {
    clearInterval(timer.current);
    if (rec.current?.state === "recording") rec.current.stop();
  };

  const start = async () => {
    setError(null);
    const mime = pickMime();
    if (mime === null || !navigator.mediaDevices?.getUserMedia) {
      setError("This browser can't record audio. Try Chrome or Safari.");
      setPhase("error");
      return;
    }
    setPhase("asking");
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    } catch {
      setError("We need the microphone to record. Allow it in your browser settings, then try again.");
      setPhase("error");
      track("voice_mic_denied");
      return;
    }
    const chunks: Blob[] = [];
    const r = new MediaRecorder(stream.current, { ...(mime ? { mimeType: mime } : {}), audioBitsPerSecond: 48_000 });
    rec.current = r;
    r.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    r.onstop = () => {
      cleanup();
      const seconds = Math.max(1, Math.min(MAX_VOICE_SECONDS, Math.round((Date.now() - started.current) / 1000)));
      const blob = new Blob(chunks, { type: (r.mimeType || mime || "audio/webm").split(";")[0] });
      setLocalUrl(URL.createObjectURL(blob));
      void upload(blob, seconds);
    };
    r.start(1000);
    started.current = Date.now();
    setElapsed(0);
    setPhase("recording");
    timer.current = setInterval(() => {
      const s = (Date.now() - started.current) / 1000;
      setElapsed(s);
      if (s >= MAX_VOICE_SECONDS) stop();
    }, 200);
  };

  const remove = () => {
    useBuilder.getState().setMeta({ voice: null });
    setPending(null);
    setLocalUrl(null);
    setPhase("idle");
    track("voice_removed");
  };

  if (phase === "recording")
    return (
      <div className="flex items-center gap-3 rounded-2xl border-[1.5px] border-petal-deep bg-petal/15 p-3">
        <span aria-hidden className="size-3 shrink-0 animate-pulse rounded-full bg-petal-deep" />
        <span className="flex-1 text-sm font-medium" aria-live="polite">
          Recording… {fmtSeconds(elapsed)} <span className="text-ink-soft">/ {fmtSeconds(MAX_VOICE_SECONDS)}</span>
        </span>
        <span aria-hidden className="hidden h-1.5 w-24 overflow-hidden rounded-full bg-line sm:block">
          <span className="block h-full bg-petal-deep" style={{ width: `${(elapsed / MAX_VOICE_SECONDS) * 100}%` }} />
        </span>
        <button type="button" className="btn-primary !px-4 !py-2 text-sm" onClick={stop}>
          <Square className="size-3.5 fill-current" aria-hidden /> Stop
        </button>
      </div>
    );

  if (voice || phase === "uploading" || (phase === "error" && pending)) {
    const src = localUrl ?? voice?.url ?? null;
    const seconds = voice?.seconds ?? pending?.seconds ?? 0;
    return (
      <div className="rounded-2xl border-[1.5px] border-ink bg-paper p-3 shadow-[2px_2px_0_0_var(--color-ink)]">
        <div className="flex items-center gap-2">
          <Mic className="size-4 shrink-0" aria-hidden />
          <span className="flex-1 text-sm font-medium">
            Voice note · {fmtSeconds(seconds)}
            {phase === "uploading" && <span className="ml-2 inline-flex items-center gap-1 text-ink-soft"><MiniBloom className="size-4" /> saving…</span>}
          </span>
          <button type="button" className="btn-ghost min-h-10 !px-2.5 text-sm" onClick={start} disabled={phase === "uploading"}>
            <RotateCcw className="size-4" aria-hidden /> Re-record
          </button>
          <button type="button" className="grid size-10 place-items-center rounded-full hover:bg-cream" onClick={remove} aria-label="Delete voice note" disabled={phase === "uploading"}>
            <Trash2 className="size-4" aria-hidden />
          </button>
        </div>
        {src ? <audio src={src} controls preload="metadata" className="mt-2 h-9 w-full" /> : <p className="mt-1 text-xs text-ink-soft">Saved with your draft.</p>}
        {phase === "error" && error && (
          <p role="alert" className="mt-2 text-sm text-petal-deep">
            {error}{" "}
            {pending && (
              <button type="button" className="underline underline-offset-2" onClick={() => upload(pending.blob, pending.seconds)}>
                Try again
              </button>
            )}
          </p>
        )}
      </div>
    );
  }

  return (
    <div>
      <button type="button" className="btn-secondary w-full justify-center" onClick={start} disabled={phase === "asking"}>
        {phase === "asking" ? <MiniBloom className="size-4" /> : <Mic className="size-4" aria-hidden />} Record a voice note <span className="text-ink-soft">(up to 1 min)</span>
      </button>
      {error && (
        <p role="alert" className="mt-1.5 text-sm text-petal-deep">
          {error}
        </p>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { Mic, Music, Play, X } from "lucide-react";
import { EMBED_HEIGHT, SONG_PROVIDERS, fmtSeconds, type Song, type Voice } from "@/lib/bouquet/media";
import { track } from "@/lib/analytics/track";

/** Song card: artwork, title and artist. `onRemove` shows a remove button (Write step). */
export function SongCard({ song, onRemove, onPlay, className = "" }: { song: Song; onRemove?: () => void; onPlay?: () => void; className?: string }) {
  const p = SONG_PROVIDERS[song.provider];
  const body = (
    <>
      <span className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-cream ring-1 ring-ink/10">
        {song.thumb ? (
          // Third-party artwork from the song's own service; next/image would proxy every host.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={song.thumb} alt="" className="size-full object-cover" loading="lazy" referrerPolicy="no-referrer" />
        ) : (
          <Music className="m-auto size-6 h-full" aria-hidden />
        )}
        {onPlay && (
          <span className="absolute inset-0 grid place-items-center bg-ink/25">
            <Play className="size-6 fill-cream text-cream" aria-hidden />
          </span>
        )}
      </span>
      <span className="min-w-0 flex-1 text-left">
        <span className="block truncate text-sm font-semibold">{song.title}</span>
        {song.artist && <span className="block truncate text-xs opacity-75">{song.artist}</span>}
        <span className="mt-0.5 flex items-center gap-1 text-[11px] font-medium" style={{ color: p.color }}>
          <Music className="size-3" aria-hidden /> {onPlay ? `Tap to play on ${p.name}` : p.name}
        </span>
      </span>
    </>
  );
  const cls = `flex w-full items-center gap-3 rounded-2xl border-[1.5px] border-ink bg-paper p-2.5 pr-3 text-ink shadow-[2px_2px_0_0_var(--color-ink)] ${className}`;
  if (onPlay)
    return (
      <button type="button" onClick={onPlay} className={`${cls} transition hover:-translate-y-0.5`} aria-label={`Play ${song.title}${song.artist ? ` by ${song.artist}` : ""}`}>
        {body}
      </button>
    );
  return (
    <div className={cls}>
      {body}
      {onRemove && (
        <button type="button" onClick={onRemove} className="grid size-10 shrink-0 place-items-center rounded-full hover:bg-cream" aria-label="Remove song">
          <X className="size-4" aria-hidden />
        </button>
      )}
    </div>
  );
}

/**
 * The player only loads when tapped: no third-party cookies before that, and the tap satisfies autoplay rules.
 */
export function SongPlayer({ song, preview }: { song: Song; preview?: boolean }) {
  const [playing, setPlaying] = useState(false);
  if (!playing)
    return (
      <SongCard
        song={song}
        onPlay={() => {
          setPlaying(true);
          if (!preview) track("song_played", { provider: song.provider });
        }}
      />
    );
  const h = EMBED_HEIGHT[song.provider];
  const src = song.provider === "spotify" ? `${song.embed}?utm_source=generator&autoplay=1` : song.embed;
  return (
    <div className="overflow-hidden rounded-2xl border-[1.5px] border-ink bg-ink shadow-[2px_2px_0_0_var(--color-ink)]">
      <iframe
        src={src}
        title={`${song.title} on ${SONG_PROVIDERS[song.provider].name}`}
        className={`block w-full ${h ? "" : "aspect-video"}`}
        style={h ? { height: h } : undefined}
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
        sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-presentation"
      />
    </div>
  );
}

export function VoicePlayer({ voice, from, preview }: { voice: Voice; from?: string; preview?: boolean }) {
  const [started, setStarted] = useState(false);
  return (
    <div className="flex items-center gap-3 rounded-2xl border-[1.5px] border-ink bg-paper p-2.5 pr-3 text-ink shadow-[2px_2px_0_0_var(--color-ink)]">
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-petal/40">
        <Mic className="size-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-semibold">
          A voice note{from ? ` from ${from}` : ""} · {fmtSeconds(voice.seconds)}
        </span>
        <audio
          src={voice.url}
          controls
          preload="none"
          className="mt-1 h-9 w-full"
          onPlay={() => {
            if (!started && !preview) track("voice_played", { seconds: voice.seconds });
            setStarted(true);
          }}
        >
          Your browser can&rsquo;t play this voice note.
        </audio>
      </span>
    </div>
  );
}

/** Song and voice note under the opened note. */
export function NoteExtras({ song, voice, from, preview }: { song: Song | null; voice: Voice | null; from?: string; preview?: boolean }) {
  if (!song && !voice) return null;
  return (
    <div className="mt-4 space-y-2.5" data-clarity-mask="true">
      {voice && <VoicePlayer voice={voice} from={from} preview={preview} />}
      {song && <SongPlayer song={song} preview={preview} />}
    </div>
  );
}

/** Compact hint on a pinned note that there's more inside. */
export function ExtrasHint({ song, voice }: { song: Song | null; voice: Voice | null }) {
  if (!song && !voice) return null;
  return (
    <span className="mt-2 flex flex-wrap gap-1.5">
      {voice && (
        <span className="inline-flex items-center gap-1 rounded-full border border-ink/20 bg-paper/80 px-2.5 py-1 text-xs font-medium text-ink">
          <Mic className="size-3.5" aria-hidden /> Voice note
        </span>
      )}
      {song && (
        <span className="inline-flex max-w-full items-center gap-1 truncate rounded-full border border-ink/20 bg-paper/80 px-2.5 py-1 text-xs font-medium text-ink">
          <Music className="size-3.5 shrink-0" aria-hidden /> <span className="truncate">{song.title}</span>
        </span>
      )}
    </span>
  );
}

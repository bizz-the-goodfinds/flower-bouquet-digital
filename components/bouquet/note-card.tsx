import { CARD_FONTS, CARD_TEMPLATES, type CardStyle } from "@/lib/bouquet/card";

const STICKER_SPOTS = ["-top-4 -right-3 rotate-12", "-bottom-4 -left-3 -rotate-12", "top-1/2 -right-4 rotate-6"];

export function NoteCard({
  to,
  from,
  message,
  style,
  className = "",
  placeholder = false,
}: {
  to: string;
  from: string;
  message: string;
  style: CardStyle;
  className?: string;
  placeholder?: boolean;
}) {
  const t = CARD_TEMPLATES[style.template] ?? CARD_TEMPLATES.paper;
  const f = CARD_FONTS[style.font] ?? CARD_FONTS.caveat;
  const show = (v: string, ph: string) => v || (placeholder ? ph : "");
  return (
    <div
      data-clarity-mask="true"
      className={`relative rounded-2xl border-[1.5px] border-ink p-6 shadow-[4px_4px_0_0_var(--color-ink)] ${className}`}
      style={{ background: t.bg, color: t.ink }}
    >
      <span aria-hidden className="absolute -top-3 left-1/2 h-6 w-20 -translate-x-1/2 -rotate-2 rounded-sm bg-butter/80 ring-1 ring-ink/10" />
      {(style.stickers ?? []).map((st, i) => (
        <span
          key={`${st}-${i}`}
          aria-hidden
          className={`pointer-events-none absolute text-3xl drop-shadow-[1px_1px_0_rgba(0,0,0,0.15)] select-none sm:text-4xl ${STICKER_SPOTS[i]}`}
        >
          {st}
        </span>
      ))}
      {show(to, "Their name") && (
        <p className="font-mono text-[11px] tracking-[0.14em] uppercase opacity-70 [overflow-wrap:anywhere]">for {show(to, "Their name")}</p>
      )}
      <p
        className="mt-3 whitespace-pre-wrap [overflow-wrap:anywhere]"
        style={{ fontFamily: f.css, fontSize: `${f.scale * 1.25}rem`, lineHeight: 1.35, color: message ? t.ink : `${t.ink}88` }}
      >
        {show(message, "Write something from the heart…")}
      </p>
      {show(from, "you") && (
        <p className="mt-4 text-right [overflow-wrap:anywhere]" style={{ fontFamily: f.css, fontSize: `${f.scale * 1.1}rem`, color: t.accent }}>
          — {show(from, "you")}
        </p>
      )}
    </div>
  );
}

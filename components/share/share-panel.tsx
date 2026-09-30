"use client";

import { useState } from "react";
import { Check, ChevronDown, Clapperboard, Copy, Film, Image as ImageIcon, Mail, QrCode, Share, Smartphone } from "lucide-react";
import type { Design } from "@/lib/bouquet/composition";
import type { CardStyle } from "@/lib/bouquet/card";
import type { Song } from "@/lib/bouquet/media";
import { track, withUtm } from "@/lib/analytics/track";
import { MiniBloom } from "@/components/ui/bloom-loader";
import { PersonalLinks } from "./personal-links";
import { useExport, type ExportKind } from "./use-export";

export function SharePanel({
  url,
  to,
  from,
  design,
  message,
  style,
  song = null,
  personal,
}: {
  url: string;
  to: string;
  from: string;
  design: Design;
  message: string;
  style: CardStyle;
  song?: Song | null;
  /** Lets the sender make one link per recipient. */
  personal?: { slug: string; token: string | null };
}) {
  const [copied, setCopied] = useState(false);
  const [qr, setQr] = useState<string | null>(null);
  const [moreWays, setMoreWays] = useState(false);
  const exp = useExport({ design, to, from, message, style, song }, "sender");
  const text = to ? `${to}, I sealed something special for you 💌 Open it:` : "I sealed something special for you 💌 Open it:";
  const canNativeShare = typeof navigator !== "undefined" && "share" in navigator;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
    track("share_clicked", { channel: "copy" });
  };

  const channels = [
    { id: "whatsapp", label: "WhatsApp", href: `https://wa.me/?text=${encodeURIComponent(`${text} ${withUtm(url, "whatsapp")}`)}` },
    { id: "telegram", label: "Telegram", href: `https://t.me/share/url?url=${encodeURIComponent(withUtm(url, "telegram"))}&text=${encodeURIComponent(text)}` },
    { id: "x", label: "X", href: `https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(withUtm(url, "x"))}` },
    { id: "sms", label: "Messages", href: `sms:?&body=${encodeURIComponent(`${text} ${withUtm(url, "sms")}`)}` },
  ];

  return (
    <div className="min-w-0 space-y-4">
      <div className="flex min-w-0 items-center gap-2 rounded-2xl border-[1.5px] border-ink bg-paper p-1.5 pl-4">
        <span className="min-w-0 flex-1 truncate font-mono text-sm" title={url}>
          {url.replace(/^https?:\/\//, "")}
        </span>
        <button onClick={copy} className="btn-primary shrink-0 !px-4 !py-2 text-sm" aria-live="polite">
          {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      {canNativeShare && (
        <button
          className="btn-primary w-full !py-3.5 text-base"
          onClick={async () => {
            try {
              await navigator.share({ title: "Something special for you 💌", text, url: withUtm(url, "native_share") });
              track("share_clicked", { channel: "native" });
            } catch {}
          }}
        >
          <Share className="size-5" aria-hidden /> Share
        </button>
      )}
      {canNativeShare && !moreWays ? (
        <button type="button" className="mx-auto flex items-center gap-1 text-sm text-ink-soft underline-offset-2 hover:text-ink hover:underline" onClick={() => setMoreWays(true)}>
          More ways to send <ChevronDown className="size-4" aria-hidden />
        </button>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {channels.map((c) => (
            <a
              key={c.id}
              href={c.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track("share_clicked", { channel: c.id })}
              className="btn-secondary !py-2.5 text-sm"
            >
              {c.label}
            </a>
          ))}
          <a
            href={`mailto:?subject=${encodeURIComponent(to ? `${to}, something special is waiting for you 💌` : "Something special is waiting for you 💌")}&body=${encodeURIComponent(`${text}\n\n${withUtm(url, "email")}`)}`}
            onClick={() => track("share_clicked", { channel: "email" })}
            className="btn-secondary !py-2.5 text-sm"
          >
            <Mail className="size-4" aria-hidden /> Email
          </a>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        {(
          [
            ["post", "Save image", ImageIcon],
            ["story", "Story 9:16", Smartphone],
            ["video", "Video", Clapperboard],
            ["gif", "GIF", Film],
          ] as [ExportKind, string, typeof ImageIcon][]
        ).map(([kind, label, Icon]) => (
          <button
            key={kind}
            className="btn-ghost min-h-16 flex-col !gap-1 rounded-2xl border border-line !py-3 text-xs"
            onClick={() => exp.run(kind)}
            disabled={exp.busy !== null}
          >
            <Icon className="size-5" aria-hidden />
            {exp.busy === kind ? (
              <span className="flex items-center gap-1">
                <MiniBloom className="size-5" />
                {kind === "video" || kind === "gif" ? `${Math.round(exp.progress * 100)}%` : "Saving…"}
              </span>
            ) : (
              label
            )}
          </button>
        ))}
        <button
          className="btn-ghost min-h-16 flex-col !gap-1 rounded-2xl border border-line !py-3 text-xs"
          onClick={async () => {
            if (qr) return setQr(null);
            const QR = await import("qrcode");
            setQr(await QR.toDataURL(withUtm(url, "qr"), { margin: 1, width: 480, color: { dark: "#1B1A17", light: "#FFFDF8" } }));
            track("share_clicked", { channel: "qr" });
          }}
        >
          <QrCode className="size-5" aria-hidden />
          {qr ? "Hide QR" : "QR code"}
        </button>
      </div>
      {personal && <PersonalLinks slug={personal.slug} token={personal.token} links={[]} />}
      {exp.error && (
        <p role="alert" className="text-sm text-petal-deep">
          {exp.error}
        </p>
      )}
      {qr && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={qr} alt="QR code linking to your bouquet" className="mx-auto w-48 rounded-xl border border-line" width={192} height={192} />
      )}
    </div>
  );
}

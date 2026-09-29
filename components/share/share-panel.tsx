"use client";

import { useState } from "react";
import { Check, Clapperboard, Copy, Film, Image as ImageIcon, Mail, QrCode, Send, Smartphone } from "lucide-react";
import type { Design } from "@/lib/bouquet/composition";
import type { CardStyle } from "@/lib/bouquet/card";
import { track } from "@/lib/analytics/track";
import { useExport, type ExportKind } from "./use-export";

export function SharePanel({ url, to, from, design, message, style }: { url: string; to: string; from: string; design: Design; message: string; style: CardStyle }) {
  const [copied, setCopied] = useState(false);
  const [qr, setQr] = useState<string | null>(null);
  const exp = useExport({ design, to, from, message, style }, "sender");
  const text = to ? `${to}, I made you a bouquet 💐` : "I made you a bouquet 💐";
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
    { id: "whatsapp", label: "WhatsApp", href: `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}` },
    { id: "telegram", label: "Telegram", href: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}` },
    { id: "x", label: "X", href: `https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}` },
    { id: "sms", label: "Messages", href: `sms:?&body=${encodeURIComponent(`${text} ${url}`)}` },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 rounded-2xl border-[1.5px] border-ink bg-paper p-1.5 pl-4">
        <span className="min-w-0 flex-1 truncate font-mono text-sm" title={url}>
          {url.replace(/^https?:\/\//, "")}
        </span>
        <button onClick={copy} className="btn-primary !px-4 !py-2 text-sm" aria-live="polite">
          {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {canNativeShare && (
          <button
            className="btn-secondary !py-2.5 text-sm"
            onClick={async () => {
              try {
                await navigator.share({ title: "A bouquet for you", text, url });
                track("share_clicked", { channel: "native" });
              } catch {}
            }}
          >
            <Send className="size-4" aria-hidden /> Share…
          </button>
        )}
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
          href={`mailto:?subject=${encodeURIComponent("A bouquet for you 💐")}&body=${encodeURIComponent(`${text}\n\n${url}`)}`}
          onClick={() => track("share_clicked", { channel: "email" })}
          className="btn-secondary !py-2.5 text-sm"
        >
          <Mail className="size-4" aria-hidden /> Email
        </a>
      </div>

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
            {exp.busy === kind ? (kind === "video" || kind === "gif" ? `${Math.round(exp.progress * 100)}%` : "Saving…") : label}
          </button>
        ))}
        <button
          className="btn-ghost min-h-16 flex-col !gap-1 rounded-2xl border border-line !py-3 text-xs"
          onClick={async () => {
            if (qr) return setQr(null);
            const QR = await import("qrcode");
            setQr(await QR.toDataURL(url, { margin: 1, width: 480, color: { dark: "#1B1A17", light: "#FFFDF8" } }));
            track("share_clicked", { channel: "qr" });
          }}
        >
          <QrCode className="size-5" aria-hidden />
          {qr ? "Hide QR" : "QR code"}
        </button>
      </div>
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

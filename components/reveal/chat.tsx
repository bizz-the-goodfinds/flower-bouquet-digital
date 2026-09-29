"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowDown, SendHorizontal } from "lucide-react";
import { MiniBloom } from "@/components/ui/bloom-loader";
import { REACTIONS } from "@/lib/bouquet/card";
import { ago, chatKey, conversationNames, type ChatMessage, type Conversation } from "@/lib/bouquet/chat";
import { markSeen } from "@/lib/local";
import { chatChannel, inboxChannel, ping, useLiveChat } from "@/lib/realtime";
import { track } from "@/lib/analytics/track";

type Side = "recipient" | "sender";
type SendFn = (msg: { emoji?: string; text?: string }) => Promise<ChatMessage | { error: string }>;

const POLL_MS = 20_000;
const isEmojiOnly = (m: ChatMessage) => Boolean(m.emoji && !m.text);
const merge = (a: ChatMessage[], b: ChatMessage[]) => {
  const byId = new Map([...a, ...b].map((m) => [m.id, m]));
  return [...byId.values()].sort((x, y) => x.at.localeCompare(y.at));
};

/** Chat bubbles, oldest at the top. `me` decides which side is on the right. */
function Bubbles({ messages, me, names }: { messages: ChatMessage[]; me: Side; names: Record<Side, string> }) {
  return (
    <>
      {messages.map((m, i) => {
        const mine = m.author === me;
        const showName = i === 0 || messages[i - 1].author !== m.author || Date.parse(m.at) - Date.parse(messages[i - 1].at) > 30 * 60_000;
        return (
          <div key={m.id} className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
            {showName && (
              <span className="mt-1.5 mb-0.5 px-1 font-mono text-[10px] tracking-wider text-ink-soft uppercase">
                {mine ? "You" : names[m.author]} · {ago(m.at)}
              </span>
            )}
            {isEmojiOnly(m) ? (
              <span className="pp-pop text-4xl leading-none" role="img" aria-label={`Reacted ${m.emoji}`}>
                {m.emoji}
              </span>
            ) : (
              <p
                className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-[15px] leading-snug [overflow-wrap:anywhere] ${
                  mine ? "rounded-br-md bg-ink text-cream" : "rounded-bl-md border-[1.5px] border-ink bg-cream text-ink"
                }`}
              >
                {m.emoji && <span className="mr-1.5 text-lg">{m.emoji}</span>}
                {m.text}
              </p>
            )}
          </div>
        );
      })}
    </>
  );
}

/** Quick reactions (one scrollable row) and a message box. Tapping an emoji sends it, with any typed text. */
function Composer({ onSend, onTyping, placeholder, disabled, busy }: { onSend: (msg: { emoji?: string; text?: string }) => void; onTyping?: () => void; placeholder: string; disabled?: boolean; busy?: boolean }) {
  const [text, setText] = useState("");
  const send = (emoji?: string) => {
    const t = text.trim();
    if (!emoji && !t) return;
    onSend({ emoji, text: t || undefined });
    setText("");
  };
  return (
    <div className="space-y-2 border-t border-line bg-paper px-3 pt-2 pb-3">
      <div className="no-scrollbar -mx-1 flex gap-1 overflow-x-auto px-1" aria-label="Quick reactions">
        {REACTIONS.map((r) => (
          <button
            key={r}
            type="button"
            disabled={disabled || busy}
            onClick={() => send(r)}
            aria-label={`Send ${r}`}
            className="grid size-9 shrink-0 place-items-center rounded-full bg-cream text-lg transition hover:scale-115 hover:bg-petal/40 active:scale-90 disabled:opacity-40"
          >
            {r}
          </button>
        ))}
      </div>
      {/* Not a <form>: the composer also renders inside the builder's form (Preview & send). */}
      <div className="flex gap-2">
        <input
          className="field !rounded-full !py-2"
          maxLength={280}
          placeholder={placeholder}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            onTyping?.();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.nativeEvent.isComposing) {
              e.preventDefault();
              send();
            }
          }}
          disabled={disabled}
          aria-label="Message"
          data-clarity-mask="true"
        />
        <button type="button" onClick={() => send()} className="btn-primary shrink-0 !px-3.5 !py-2" disabled={disabled || busy || !text.trim()} aria-label="Send message">
          {busy ? <MiniBloom /> : <SendHorizontal className="size-4" aria-hidden />}
        </button>
      </div>
    </div>
  );
}

/**
 * A fixed-size chat window, like a messaging app: newest message at the bottom, scroll up to load older ones.
 * Live when both sides have it open (typing + instant delivery), with polling as a fallback.
 */
function ChatWindow({
  slug,
  conversation,
  me,
  names,
  send,
  staticMessages,
  refreshKey,
  header,
  empty,
  placeholder,
}: {
  slug: string;
  /** null while the recipient's conversation id is being worked out. */
  conversation: string | null;
  me: Side;
  names: Record<Side, string>;
  /** Omit for read-only chats. */
  send?: SendFn;
  /** Messages that can't be fetched by id (reactions from before chat existed). */
  staticMessages?: ChatMessage[];
  refreshKey?: number;
  header: React.ReactNode;
  empty: React.ReactNode;
  placeholder: string;
}) {
  const live = !staticMessages && conversation ? conversation : null;
  const [messages, setMessages] = useState<ChatMessage[] | null>(staticMessages ?? null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unseenBelow, setUnseenBelow] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const pin = useRef<{ mode: "bottom" } | { mode: "keep"; height: number; top: number } | null>({ mode: "bottom" });

  const nearBottom = () => {
    const el = box.current;
    return !el || el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  };

  const fetchPage = useCallback(
    async (before?: string) => {
      if (!live) return null;
      const q = new URLSearchParams({ c: live, ...(before ? { before } : {}) });
      const res = await fetch(`/api/bouquets/${slug}/chat?${q}`).catch(() => null);
      return res?.ok ? ((await res.json()) as { messages: ChatMessage[]; hasMore: boolean }) : null;
    },
    [slug, live],
  );

  const refresh = useCallback(async () => {
    const data = await fetchPage();
    if (!data) return setMessages((m) => m ?? []);
    const grew = (prev: ChatMessage[] | null) => prev !== null && data.messages.some((m) => !prev.some((p) => p.id === m.id));
    setMessages((prev) => {
      if (prev === null) {
        setHasMore(data.hasMore);
        pin.current = { mode: "bottom" };
      } else if (grew(prev)) {
        if (nearBottom()) pin.current = { mode: "bottom" };
        else setUnseenBelow(true);
      }
      return merge(prev ?? [], data.messages);
    });
  }, [fetchPage]);

  const liveChat = useLiveChat(live ? chatChannel(slug, live) : null, me, refresh);

  // First load, polling fallback, and refreshes asked for from outside.
  useEffect(() => {
    if (!live) return;
    const first = setTimeout(refresh, 0);
    const id = setInterval(() => document.visibilityState === "visible" && refresh(), POLL_MS);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [live, refresh, refreshKey]);

  // Keep the view pinned: to the bottom for new messages, or in place when older ones load above.
  useLayoutEffect(() => {
    const el = box.current;
    const p = pin.current;
    if (!el || !p) return;
    el.scrollTop = p.mode === "bottom" ? el.scrollHeight : el.scrollHeight - p.height + p.top;
    pin.current = null;
  }, [messages]);

  useEffect(() => {
    const last = messages?.at(-1);
    if (conversation && last) markSeen(chatKey(slug, conversation), last.at);
  }, [messages, slug, conversation]);

  const loadOlder = async () => {
    const oldest = messages?.[0];
    if (!oldest || !hasMore || loadingOlder) return;
    setLoadingOlder(true);
    const data = await fetchPage(oldest.at);
    setLoadingOlder(false);
    if (!data) return;
    const el = box.current;
    if (el) pin.current = { mode: "keep", height: el.scrollHeight, top: el.scrollTop };
    setHasMore(data.hasMore);
    setMessages((prev) => merge(data.messages, prev ?? []));
  };

  const onSend = async (msg: { emoji?: string; text?: string }) => {
    if (!send) return;
    setBusy(true);
    setError(null);
    const out = await send(msg);
    setBusy(false);
    if ("error" in out) return setError(out.error);
    pin.current = { mode: "bottom" };
    setMessages((m) => merge(m ?? [], [out]));
    liveChat.notify();
  };

  const other = names[me === "sender" ? "recipient" : "sender"];
  const status = liveChat.peerTyping ? `${other} is typing…` : liveChat.peerOnline ? `${other} is here` : null;

  return (
    <div className="flex h-[24rem] flex-col overflow-hidden rounded-[1.25rem] border-[1.5px] border-ink bg-paper text-left text-ink shadow-[3px_3px_0_0_var(--color-ink)]">
      <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
        <div className="min-w-0 flex-1 text-sm font-medium">{header}</div>
        {status && (
          <span className="flex shrink-0 items-center gap-1.5 text-xs text-sage-deep" aria-live="polite">
            <span className="size-2 animate-pulse rounded-full bg-sage-deep" aria-hidden />
            {status}
          </span>
        )}
      </div>
      <div className="relative min-h-0 flex-1">
        <div
          ref={box}
          onScroll={(e) => {
            if (e.currentTarget.scrollTop < 40) loadOlder();
            if (nearBottom()) setUnseenBelow(false);
          }}
          className="h-full space-y-1 overflow-y-auto overscroll-contain px-3 py-2"
          data-clarity-mask="true"
          aria-live="polite"
          role="log"
        >
          {messages === null ? (
            <div className="grid h-full place-items-center">
              <MiniBloom className="size-12" />
            </div>
          ) : messages.length === 0 ? (
            <div className="grid h-full place-items-center px-4 text-center text-sm text-ink-soft">{empty}</div>
          ) : (
            <>
              <p className="py-1 text-center text-[11px] text-ink-soft">
                {loadingOlder ? <MiniBloom className="mx-auto size-6" /> : hasMore ? "Scroll up for earlier messages" : "This is the start of your chat 🌸"}
              </p>
              <Bubbles messages={messages} me={me} names={names} />
            </>
          )}
        </div>
        {unseenBelow && (
          <button
            type="button"
            onClick={() => {
              box.current?.scrollTo({ top: box.current.scrollHeight, behavior: "smooth" });
              setUnseenBelow(false);
            }}
            className="absolute bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-ink px-3 py-1.5 text-xs text-cream shadow-[2px_2px_0_0_var(--color-petal)]"
          >
            <ArrowDown className="size-3.5" aria-hidden /> New messages
          </button>
        )}
      </div>
      {error && <p className="px-4 pb-1 text-sm text-petal-deep">{error}</p>}
      {send ? (
        <Composer onSend={onSend} onTyping={liveChat.typing} busy={busy} disabled={!conversation} placeholder={placeholder} />
      ) : (
        <p className="border-t border-line px-4 py-3 text-xs text-ink-soft">These came in before chat existed, so they can&rsquo;t be answered.</p>
      )}
    </div>
  );
}

/** The recipient's chat with the sender. */
export function RecipientChat({ slug, conversation, from }: { slug: string; conversation: string | null; from: string }) {
  const who = from || "them";
  const send: SendFn = async (msg) => {
    const res = await fetch("/api/reactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, conversation, emoji: msg.emoji, reply: msg.text }),
    }).catch(() => null);
    if (!res?.ok) return { error: res?.status === 429 ? "Slow down a little 🙂" : "Couldn’t send. Try again?" };
    track("reaction_sent", { emoji: msg.emoji ?? "none", has_reply: Boolean(msg.text) });
    ping(inboxChannel(slug)); // the sender's My bouquets updates live
    return ((await res.json()) as { message: ChatMessage }).message;
  };
  return (
    <ChatWindow
      slug={slug}
      conversation={conversation}
      me="recipient"
      names={{ sender: from || "Sender", recipient: "You" }}
      send={send}
      header={<>Chat with {who} 💬</>}
      empty={
        <span>
          <span className="block font-display text-2xl text-ink">How does it make you feel?</span>
          Tap an emoji below or say something back.
        </span>
      }
      placeholder={`Message ${who}…`}
    />
  );
}

/** What the sender sees in their own preview: one tab per recipient, answer each one. */
export function SenderChat({ slug, token, to, conversations, refreshKey }: { slug: string; token: string | null; to: string; conversations: Conversation[]; refreshKey?: number }) {
  const names = conversationNames(conversations, to);
  const [active, setActive] = useState<string | null>(() => pickFirst(conversations));
  const conv = conversations.find((c) => c.id === active) ?? conversations[0] ?? null;

  if (!conv)
    return (
      <div className="rounded-[1.25rem] border-[1.5px] border-ink bg-paper px-4 py-3 text-left shadow-[3px_3px_0_0_var(--color-ink)]">
        <p className="text-sm font-medium">Reactions & chat 💬</p>
        <p className="mt-1 text-sm text-ink-soft">No reactions yet. When {to || "they"} react, it shows up here and you can chat back, live.</p>
      </div>
    );

  const canReply = conv.id !== "legacy" && (conv.id.startsWith("l:") || conv.messages.some((m) => m.author === "recipient"));
  const name = names.get(conv.id) ?? "Them";
  const send: SendFn = async (msg) => {
    const res = await fetch(`/api/bouquets/${slug}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { "x-edit-token": token } : {}) },
      body: JSON.stringify({ conversation: conv.id, emoji: msg.emoji, text: msg.text }),
    }).catch(() => null);
    if (!res?.ok) return { error: "Couldn’t send. Try again?" };
    track("sender_reply_sent", { has_text: Boolean(msg.text) });
    return ((await res.json()) as { message: ChatMessage }).message;
  };

  return (
    <div className="space-y-2">
      {conversations.length > 1 && (
        <div role="tablist" aria-label="People" className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
          {conversations.map((c) => (
            <button key={c.id} role="tab" aria-selected={c.id === conv.id} onClick={() => setActive(c.id)} className={`chip shrink-0 !py-1 ${c.id === conv.id ? "!border-ink !bg-ink text-cream" : ""}`}>
              {names.get(c.id)}
              <span aria-hidden>{[...c.messages].reverse().find((m) => m.author === "recipient" && m.emoji)?.emoji}</span>
            </button>
          ))}
        </div>
      )}
      <ChatWindow
        key={conv.id}
        slug={slug}
        conversation={conv.id === "legacy" ? null : conv.id}
        me="sender"
        names={{ sender: "You", recipient: conv.id === "legacy" ? to || "Them" : name }}
        send={canReply ? send : undefined}
        staticMessages={conv.id === "legacy" ? conv.messages : undefined}
        refreshKey={refreshKey}
        header={
          <span className="flex flex-col">
            <span>{name}</span>
            {conv.id.startsWith("l:") && (
              <span className="text-xs font-normal text-ink-soft">{conv.openedAt ? `Opened · ${conv.views} ${conv.views === 1 ? "open" : "opens"}` : "Hasn’t opened it yet"}</span>
            )}
          </span>
        }
        empty={<span>Nothing yet. Say hi, or wait for {name} to react.</span>}
        placeholder={`Reply to ${name}…`}
      />
    </div>
  );
}

function pickFirst(list: Conversation[]) {
  // Most recently active conversation first.
  const withMsgs = list.filter((c) => c.messages.length).sort((a, b) => (b.messages.at(-1)!.at > a.messages.at(-1)!.at ? 1 : -1));
  return (withMsgs[0] ?? list[0])?.id ?? null;
}

/** Non-interactive stand-in shown in the "Preview & send" replay. */
export function PreviewChat() {
  return (
    <div className="pointer-events-none flex h-[24rem] flex-col overflow-hidden rounded-[1.25rem] border-[1.5px] border-ink bg-paper text-left text-ink shadow-[3px_3px_0_0_var(--color-ink)]" aria-hidden>
      <p className="border-b border-line px-4 py-2.5 text-sm font-medium">Chat 💬</p>
      <div className="grid flex-1 place-items-center px-4 text-center text-sm text-ink-soft">They can react and chat with you here, live.</div>
      <div className="opacity-60">
        <Composer onSend={() => {}} disabled placeholder="Say something back…" />
      </div>
    </div>
  );
}

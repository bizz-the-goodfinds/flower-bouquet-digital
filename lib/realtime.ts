"use client";

import { useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabaseBrowser } from "./supabase/browser";

type Side = "recipient" | "sender";

const enabled = () => Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

/** Channel for one chat. The conversation id is the secret part, so only its two sides can find it. */
export const chatChannel = (slug: string, conversation: string) => `chat:${slug}:${conversation}`;
/** Channel the sender listens on for "something new" across all of a bouquet's chats. */
export const inboxChannel = (slug: string) => `inbox:${slug}`;

/**
 * Live layer for a chat (Supabase Realtime broadcast + presence). Only pings travel over it:
 * "new message" makes the other side refetch from the API, so nothing unverified is ever shown.
 * Polling stays on as the fallback when realtime is unavailable.
 */
export function useLiveChat(name: string | null, me: Side, onNew: () => void) {
  const [peerOnline, setPeerOnline] = useState(false);
  const [peerTyping, setPeerTyping] = useState(false);
  const channel = useRef<RealtimeChannel | null>(null);
  const onNewRef = useRef(onNew);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const lastTypingSent = useRef(0);

  useEffect(() => {
    onNewRef.current = onNew;
  });

  useEffect(() => {
    if (!name || !enabled()) return;
    let cancelled = false;
    let off = () => {};
    supabaseBrowser().then((sb) => {
      if (cancelled) return;
      const ch = sb.channel(name, { config: { broadcast: { self: false }, presence: { key: `${me}-${Math.random().toString(36).slice(2, 8)}` } } });
      ch.on("broadcast", { event: "new" }, () => onNewRef.current())
        .on("broadcast", { event: "typing" }, ({ payload }) => {
          if (payload?.side === me) return;
          setPeerTyping(true);
          clearTimeout(typingTimer.current);
          typingTimer.current = setTimeout(() => setPeerTyping(false), 3500);
        })
        .on("presence", { event: "sync" }, () => {
          const state = ch.presenceState<{ side: Side }>();
          setPeerOnline(Object.values(state).some((list) => list.some((p) => p.side !== me)));
        })
        .subscribe((status) => {
          if (status === "SUBSCRIBED") ch.track({ side: me }).catch(() => {});
        });
      channel.current = ch;
      off = () => sb.removeChannel(ch);
    });
    return () => {
      cancelled = true;
      clearTimeout(typingTimer.current);
      channel.current = null;
      setPeerOnline(false);
      setPeerTyping(false);
      off();
    };
  }, [name, me]);

  return {
    peerOnline,
    peerTyping,
    /** Tell the other side a message landed. */
    notify: () => channel.current?.send({ type: "broadcast", event: "new", payload: {} }).catch(() => {}),
    /** Throttled "is typing" signal. */
    typing: () => {
      const now = Date.now();
      if (now - lastTypingSent.current < 2000) return;
      lastTypingSent.current = now;
      channel.current?.send({ type: "broadcast", event: "typing", payload: { side: me } }).catch(() => {});
    },
  };
}

/** Fire-and-forget ping on a channel we aren't subscribed to (e.g. the sender's inbox). */
export async function ping(name: string) {
  if (!enabled()) return;
  const sb = await supabaseBrowser();
  const ch = sb.channel(name, { config: { broadcast: { self: false } } });
  await new Promise<void>((resolve) => {
    const t = setTimeout(resolve, 4000);
    ch.subscribe(async (status) => {
      if (status !== "SUBSCRIBED") return;
      await ch.send({ type: "broadcast", event: "new", payload: {} }).catch(() => {});
      clearTimeout(t);
      resolve();
    });
  });
  sb.removeChannel(ch);
}

/** Calls `onPing` whenever something new arrives on any of these channels. */
export function useInbox(names: string[], onPing: () => void) {
  const key = names.join("|");
  const onPingRef = useRef(onPing);
  useEffect(() => {
    onPingRef.current = onPing;
  });
  useEffect(() => {
    if (!key || !enabled()) return;
    let cancelled = false;
    let off = () => {};
    supabaseBrowser().then((sb) => {
      if (cancelled) return;
      const chans = key.split("|").map((n) => sb.channel(n).on("broadcast", { event: "new" }, () => onPingRef.current()).subscribe());
      off = () => chans.forEach((c) => sb.removeChannel(c));
    });
    return () => {
      cancelled = true;
      off();
    };
  }, [key]);
}

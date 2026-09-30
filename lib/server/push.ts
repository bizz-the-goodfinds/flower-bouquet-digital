import "server-only";
import webpush from "web-push";
import { supabaseAdmin } from "@/lib/supabase/admin";

/** What a sender can be told about. Each can be switched off in My bouquets. */
export type PushKind = "opened" | "chat" | "reveal";
export type PushPrefs = Record<PushKind, boolean>;
export const DEFAULT_PREFS: PushPrefs = { opened: true, chat: true, reveal: true };

type Sub = { id: string; endpoint: string; p256dh: string; auth: string; prefs: Partial<PushPrefs> | null };
type Payload = { title: string; body: string; url: string; tag: string };

/** Where a notification tap lands, tagged so GA counts it as a push visit (not "direct"). */
const landing = (kind: string) => `/garden?utm_source=push&utm_medium=notification&utm_campaign=${kind}`;

let configured: boolean | null = null;
function ready() {
  if (configured === null) {
    const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const priv = process.env.VAPID_PRIVATE_KEY;
    configured = Boolean(pub && priv);
    if (configured) webpush.setVapidDetails(process.env.VAPID_SUBJECT ?? "mailto:hello@example.com", pub!, priv!);
  }
  return configured;
}

type Target = { id: string; slug: string; owner_id: string | null; recipient_name: string | null };

async function target(bouquetId: string) {
  const { data } = await supabaseAdmin().from("bouquets").select("id, slug, owner_id, recipient_name").eq("id", bouquetId).is("deleted_at", null).maybeSingle<Target>();
  return data;
}

/** Devices that asked to hear about this bouquet: the owner's account, plus signed-out devices that proved they sent it. */
async function subscriptionsFor(b: Target): Promise<Sub[]> {
  const db = supabaseAdmin();
  const cols = "id, endpoint, p256dh, auth, prefs";
  const [linked, owned] = await Promise.all([
    db.from("push_bouquets").select(`push_subscriptions!inner(${cols})`).eq("bouquet_id", b.id).returns<{ push_subscriptions: Sub }[]>(),
    b.owner_id ? db.from("push_subscriptions").select(cols).eq("user_id", b.owner_id).returns<Sub[]>() : null,
  ]);
  const all = new Map<string, Sub>();
  for (const r of linked.data ?? []) all.set(r.push_subscriptions.id, r.push_subscriptions);
  for (const s of owned?.data ?? []) all.set(s.id, s);
  return [...all.values()];
}

async function send(bouquetId: string, kind: PushKind, build: (b: Target) => Payload) {
  if (!ready()) return;
  try {
    const b = await target(bouquetId);
    if (!b) return;
    const subs = (await subscriptionsFor(b)).filter((s) => ({ ...DEFAULT_PREFS, ...s.prefs })[kind]);
    if (!subs.length) return;
    const payload = JSON.stringify(build(b));
    const gone: string[] = [];
    await Promise.all(
      subs.map((s) =>
        webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { TTL: 24 * 3600, urgency: "normal" }).catch((err: { statusCode?: number }) => {
          // The browser dropped this subscription: forget it.
          if (err.statusCode === 404 || err.statusCode === 410) gone.push(s.id);
          else console.warn("push failed", err.statusCode);
        }),
      ),
    );
    if (gone.length) await supabaseAdmin().from("push_subscriptions").delete().in("id", gone);
  } catch (err) {
    console.warn("push skipped", err);
  }
}

const who = (name: string | null | undefined, fallback = "They") => (name?.trim() ? name.trim() : fallback);

/** First open of a bouquet, or of one personal link (`linkName`). */
export const notifyOpened = (bouquetId: string, linkName?: string | null) =>
  send(bouquetId, "opened", (b) => ({
    title: `${who(linkName ?? b.recipient_name, "Someone")} opened your bouquet 💐`,
    body: "Tap to see if they wrote back.",
    url: landing("opened"),
    tag: `opened-${b.slug}-${linkName ?? ""}`,
  }));

/** A recipient reacted or wrote. Message text stays off the lock screen. */
export const notifyChat = (bouquetId: string, msg: { emoji?: string | null; text?: string | null; name?: string | null }) =>
  send(bouquetId, "chat", (b) => ({
    title: msg.text ? `New message from ${who(msg.name ?? b.recipient_name)}` : `${who(msg.name ?? b.recipient_name)} reacted ${msg.emoji ?? "💌"}`,
    body: msg.text ? "Open My bouquets to read it." : `To the bouquet you sent${b.recipient_name ? ` ${b.recipient_name}` : ""}.`,
    url: landing("chat"),
    tag: `chat-${b.slug}`,
  }));

/** Someone answered a bouquet with one of their own ("Send one back"). */
export const notifyReply = (bouquetId: string, from: string | null | undefined) =>
  send(bouquetId, "chat", (b) => ({
    title: `${who(from, b.recipient_name ?? "Someone")} sent you flowers back 🌷`,
    body: "Open My bouquets to see it.",
    url: landing("reply"),
    tag: `reply-${b.slug}`,
  }));

/** A scheduled bouquet just unlocked for its recipient. */
export const notifyRevealed = (bouquetId: string) =>
  send(bouquetId, "reveal", (b) => ({
    title: `Your bouquet for ${who(b.recipient_name, "them")} just unlocked 🔓`,
    body: "They can open it now.",
    url: landing("reveal"),
    tag: `reveal-${b.slug}`,
  }));

/**
 * Tells senders about scheduled bouquets whose time has come. Claims each row first (reveal_notified_at),
 * so the cron and page visits never notify twice.
 */
export async function notifyDueReveals(ids?: string[]) {
  const db = supabaseAdmin();
  let q = db
    .from("bouquets")
    .update({ reveal_notified_at: new Date().toISOString() })
    .lte("reveal_at", new Date().toISOString())
    .is("reveal_notified_at", null)
    .is("deleted_at", null);
  if (ids) q = q.in("id", ids);
  const { data } = await q.select("id").returns<{ id: string }[]>();
  await Promise.all((data ?? []).map((r) => notifyRevealed(r.id)));
  return data?.length ?? 0;
}

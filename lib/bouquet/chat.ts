/** One message between the sender and a recipient. Emoji-only messages are reactions. */
export type ChatMessage = { id: string; author: "recipient" | "sender"; emoji: string | null; text: string | null; at: string };

/** One recipient's chat with the sender: a personal link (`l:`), a device (`d:`), or reactions from before chat existed (`legacy`). */
export type Conversation = { id: string; name: string | null; views: number | null; openedAt: string | null; messages: ChatMessage[] };

/** Display name for each conversation of a bouquet, e.g. "Sam", or "Someone 2" when several people share the main link. */
export function conversationNames(list: Conversation[], to: string) {
  const unnamed = list.filter((c) => !c.name && c.id !== "legacy");
  const names = new Map<string, string>();
  let n = 0;
  for (const c of list) {
    if (c.name) names.set(c.id, c.name);
    else if (c.id === "legacy") names.set(c.id, "Earlier reactions");
    else names.set(c.id, unnamed.length === 1 ? to || "Them" : `${to || "Someone"} ${++n}`);
  }
  return names;
}

/** Short relative time: "now", "5m", "3h", "2d", or a date. */
export function ago(iso: string, now = Date.now()) {
  const s = Math.max(0, (now - new Date(iso).getTime()) / 1000);
  if (s < 60) return "now";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  if (s < 7 * 86400) return `${Math.floor(s / 86400)}d`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export const chatKey = (slug: string, conversation: string) => `${slug}:${conversation}`;

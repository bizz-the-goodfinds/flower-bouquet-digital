import "server-only";

export type Msg = { id: string; author: "recipient" | "sender"; emoji: string | null; reply: string | null; conversation: string | null; created_at: string };
export const MESSAGE_COLS = "id, author, emoji, reply, conversation, created_at";

export const toMessage = (m: Msg) => ({ id: m.id, author: m.author, emoji: m.emoji, text: m.reply, at: m.created_at });

/** Groups messages into conversations (personal links first, even before anyone replies). Legacy reactions without a conversation share one. */
export function groupConversations(msgs: Msg[], links: { key: string; name: string; view_count: number; opened_at: string | null }[]) {
  const map = new Map<string, { id: string; name: string | null; views: number | null; openedAt: string | null; messages: ReturnType<typeof toMessage>[] }>();
  for (const l of links) map.set(`l:${l.key}`, { id: `l:${l.key}`, name: l.name, views: l.view_count, openedAt: l.opened_at, messages: [] });
  for (const m of [...msgs].sort((a, b) => a.created_at.localeCompare(b.created_at))) {
    const id = m.conversation ?? "legacy";
    if (!map.has(id)) map.set(id, { id, name: null, views: null, openedAt: null, messages: [] });
    map.get(id)!.messages.push(toMessage(m));
  }
  return [...map.values()];
}


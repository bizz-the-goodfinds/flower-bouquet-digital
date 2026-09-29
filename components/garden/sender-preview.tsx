"use client";

import { useEffect, useRef, useState } from "react";
import { RotateCcw, X } from "lucide-react";
import { RecipientView } from "@/components/reveal/recipient-view";
import { PersonalLinks } from "@/components/share/personal-links";
import { Tooltip } from "@/components/ui/tooltip";
import type { Conversation } from "@/lib/bouquet/chat";
import type { PublicBouquet } from "@/lib/server/bouquets";

/**
 * The sender replays their own bouquet exactly as recipients see it, with every recipient's chat.
 * Nothing here is tracked and it never counts as an open.
 */
export function SenderPreview({
  bouquet,
  token,
  conversations: initial,
  onConversations,
  onClose,
  refreshKey = 0,
}: {
  bouquet: PublicBouquet;
  token: string | null;
  conversations: Conversation[];
  onConversations: (next: Conversation[]) => void;
  onClose: () => void;
  /** Bumped when something new arrives (live ping or poll): refetch the chats. */
  refreshKey?: number;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [run, setRun] = useState(0);
  const [conversations, setConversations] = useState(initial);

  const update = (next: Conversation[]) => {
    setConversations(next);
    onConversations(next);
  };

  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
    return () => d?.close();
  }, []);

  useEffect(() => {
    // Fetch the latest chats (the list may be a few minutes old, and new people may have reacted).
    let cancelled = false;
    fetch(`/api/bouquets/${bouquet.slug}/chat`, { headers: token ? { "x-edit-token": token } : {} })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { conversations: Conversation[] } | null) => {
        if (!cancelled && data) update(data.conversations);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bouquet.slug, token, refreshKey]);

  const links = conversations.filter((c) => c.id.startsWith("l:")).map((c) => ({ key: c.id.slice(2), name: c.name ?? "", views: c.views, openedAt: c.openedAt }));

  const actions = (
    <div className="flex items-center gap-1.5">
      <Tooltip label="Play the opening again" side="bottom">
        <button type="button" className="grid size-11 place-items-center rounded-full border border-line bg-paper" onClick={() => setRun((r) => r + 1)} aria-label="Replay">
          <RotateCcw className="size-4" aria-hidden />
        </button>
      </Tooltip>
      <button type="button" className="btn-primary min-h-11 !px-4 text-sm" onClick={onClose}>
        <X className="size-4" aria-hidden /> Close
      </button>
    </div>
  );

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      aria-label="Preview of your bouquet"
      className="m-0 h-dvh max-h-none w-screen max-w-none overflow-y-auto bg-cream p-0 text-ink backdrop:bg-ink/60"
    >
      <p className="sticky top-0 z-40 h-7 truncate bg-ink px-4 text-center text-xs leading-7 text-cream">
        <span className="font-medium">Your preview</span> · what {bouquet.to || "they"} see · doesn&rsquo;t count as an open
      </p>
      <RecipientView
        key={run}
        bouquet={bouquet}
        preview
        previewActions={actions}
        sender={{
          token,
          conversations,
          refreshKey,
          extra: (
            <PersonalLinks
              slug={bouquet.slug}
              token={token}
              links={links}
              onChange={(next) =>
                update([
                  ...conversations.filter((c) => !c.id.startsWith("l:") || next.some((l) => `l:${l.key}` === c.id)),
                  ...next.filter((l) => !conversations.some((c) => c.id === `l:${l.key}`)).map((l) => ({ id: `l:${l.key}`, name: l.name, views: 0, openedAt: null, messages: [] })),
                ])
              }
            />
          ),
        }}
      />
    </dialog>
  );
}

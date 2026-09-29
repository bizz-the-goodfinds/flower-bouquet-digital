"use client";

import { ArrowDownToLine, ArrowUpToLine, Copy, FlipHorizontal2, Minus, Plus, Redo2, RotateCcw, RotateCw, Shuffle, Trash2, Undo2, Wand2 } from "lucide-react";
import { STEM_BY_SLUG } from "@/lib/bouquet/catalog";
import { MAX_STEMS, isGreenery, newId } from "@/lib/bouquet/composition";
import { useBuilder } from "@/lib/bouquet/store";
import { track } from "@/lib/analytics/track";

function IconBtn({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className="grid size-11 shrink-0 place-items-center rounded-full text-ink transition hover:bg-ink/5 active:scale-90 disabled:opacity-30"
    >
      {children}
    </button>
  );
}

export function TopBar({ onSurprise }: { onSurprise: () => void }) {
  const canUndo = useBuilder((s) => s.past.length > 0);
  const canRedo = useBuilder((s) => s.future.length > 0);
  const count = useBuilder((s) => s.design.items.length);
  const { undo, redo, shuffle, commit, select } = useBuilder.getState();
  return (
    <div className="flex items-center justify-between gap-1">
      <div className="flex items-center">
        <IconBtn label="Undo" onClick={undo} disabled={!canUndo}>
          <Undo2 className="size-5" />
        </IconBtn>
        <IconBtn label="Redo" onClick={redo} disabled={!canRedo}>
          <Redo2 className="size-5" />
        </IconBtn>
        <IconBtn
          label="Clear all"
          disabled={!count}
          onClick={() => {
            commit((d) => ({ ...d, items: [] }));
            select(null);
          }}
        >
          <Trash2 className="size-[18px]" />
        </IconBtn>
      </div>
      <div className="flex items-center gap-2">
        <button type="button" onClick={onSurprise} className="btn-ghost !px-3 text-sm whitespace-nowrap" aria-label="Surprise me">
          <Wand2 className="size-4" aria-hidden /> <span className="hidden sm:inline">Surprise me</span>
        </button>
        <button
          type="button"
          disabled={count < 2}
          onClick={() => {
            shuffle();
            track("shuffle_used");
          }}
          className="btn-secondary !px-4 !py-2 text-sm"
        >
          <Shuffle className="size-4" aria-hidden /> Shuffle
        </button>
      </div>
    </div>
  );
}

export function ItemToolbar() {
  const item = useBuilder((s) => s.design.items.find((i) => i.id === s.selectedId));
  const count = useBuilder((s) => s.design.items.length);
  if (!item) return null;
  const { updateItem, removeItem, commit, select } = useBuilder.getState();
  const green = isGreenery(item);
  const def = STEM_BY_SLUG.get(item.f);
  const rot = (d: number) => updateItem(item.id, { r: Math.max(-180, Math.min(180, item.r + d)) });
  const size = (d: number) => updateItem(item.id, { s: Math.max(0.5, Math.min(1.8, Math.round((item.s + d) * 100) / 100)) });
  const move = (dir: 1 | -1) =>
    commit((d) => {
      const rest = d.items.filter((i) => i.id !== item.id);
      return { ...d, items: dir === 1 ? [...rest, item] : [item, ...rest] };
    });

  return (
    <div className="flex max-w-full min-w-0 items-center gap-1 overflow-x-auto rounded-full border-[1.5px] border-ink bg-paper px-2 py-1 shadow-[3px_3px_0_0_var(--color-ink)] no-scrollbar" role="toolbar" aria-label={`Edit ${def?.name}`}>
      <span className="shrink-0 px-2 text-sm font-medium whitespace-nowrap">{def?.name}</span>
      {!green && (
        <>
          <IconBtn label="Rotate left" onClick={() => rot(-15)}>
            <RotateCcw className="size-[18px]" />
          </IconBtn>
          <IconBtn label="Rotate right" onClick={() => rot(15)}>
            <RotateCw className="size-[18px]" />
          </IconBtn>
        </>
      )}
      <IconBtn label="Smaller" onClick={() => size(-0.1)} disabled={item.s <= 0.5}>
        <Minus className="size-[18px]" />
      </IconBtn>
      <IconBtn label="Bigger" onClick={() => size(0.1)} disabled={item.s >= 1.8}>
        <Plus className="size-[18px]" />
      </IconBtn>
      {!green && (
        <IconBtn label="Flip" onClick={() => updateItem(item.id, { fx: !item.fx })}>
          <FlipHorizontal2 className="size-[18px]" />
        </IconBtn>
      )}
      <IconBtn label="Bring to front" onClick={() => move(1)}>
        <ArrowUpToLine className="size-[18px]" />
      </IconBtn>
      <IconBtn label="Send to back" onClick={() => move(-1)}>
        <ArrowDownToLine className="size-[18px]" />
      </IconBtn>
      <IconBtn
        label="Duplicate"
        disabled={count >= MAX_STEMS}
        onClick={() => {
          const copy = { ...item, id: newId(), x: Math.min(900, item.x + 50), y: Math.max(90, item.y - 30) };
          commit((d) => ({ ...d, items: [...d.items, copy] }));
          select(copy.id);
        }}
      >
        <Copy className="size-[18px]" />
      </IconBtn>
      <IconBtn label="Remove" onClick={() => removeItem(item.id)}>
        <Trash2 className="size-[18px] text-petal-deep" />
      </IconBtn>
    </div>
  );
}

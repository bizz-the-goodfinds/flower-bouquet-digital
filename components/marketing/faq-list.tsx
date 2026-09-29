export function FaqList({ items, className = "" }: { items: { q: string; a: string }[]; className?: string }) {
  return (
    <div className={`divide-y divide-line rounded-[var(--radius-card)] border border-line bg-paper ${className}`}>
      {items.map((f) => (
        <details key={f.q} className="group px-5 py-4 [&_summary::-webkit-details-marker]:hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[17px] font-medium">
            <h3>{f.q}</h3>
            <span aria-hidden className="grid size-7 shrink-0 place-items-center rounded-full border border-line text-lg transition group-open:rotate-45">
              +
            </span>
          </summary>
          <p className="mt-3 leading-relaxed text-ink/80">{f.a}</p>
        </details>
      ))}
    </div>
  );
}

import { LOGO_MARK_INNER } from "@/lib/brand";

export function LogoMark({ className = "size-9" }: { className?: string }) {
  return <svg viewBox="0 0 64 64" className={className} aria-hidden="true" dangerouslySetInnerHTML={{ __html: LOGO_MARK_INNER }} />;
}

export function Logo({ compact = false, collapse = false }: { compact?: boolean; collapse?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap">
      <LogoMark className={compact ? "size-7" : "size-9"} />
      <span className={`flex-col leading-none ${collapse ? "hidden min-[440px]:flex" : "flex"}`}>
        <span className={`font-display tracking-tight italic ${compact ? "text-[19px]" : "text-[23px]"}`}>Flower Bouquet</span>{" "}
        <span className={`font-mono tracking-[0.32em] text-ink-soft uppercase ${compact ? "text-[8px]" : "text-[9px]"}`}>Digital</span>
      </span>
    </span>
  );
}

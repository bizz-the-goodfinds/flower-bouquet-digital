import { site } from "@/lib/site";

export function LogoMark({ className = "size-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <path d="M32 40 C31 48 30 54 28 60" fill="none" stroke="#1B1A17" strokeWidth="5" strokeLinecap="round" />
      <path d="M32 40 C31 48 30 54 28 60" fill="none" stroke="#6E9C63" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M30 52 C22 50 18 45 17 40 C25 40 29 45 30 52Z" fill="#9DB59A" stroke="#1B1A17" strokeWidth="2" strokeLinejoin="round" />
      {[0, 72, 144, 216, 288].map((a) => (
        <path
          key={a}
          d="M0 0 C11 -3 13 -20 0 -21 C-13 -20 -11 -3 0 0Z"
          transform={`translate(32 24) rotate(${a})`}
          fill="#F4A6C0"
          stroke="#1B1A17"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      ))}
      <circle cx="32" cy="24" r="5.5" fill="#F7DE8A" stroke="#1B1A17" strokeWidth="2" />
    </svg>
  );
}

export function Logo() {
  return (
    <span className="inline-flex items-center gap-2">
      <LogoMark />
      <span className="font-display text-[26px] leading-none tracking-tight italic">{site.wordmark}</span>
    </span>
  );
}

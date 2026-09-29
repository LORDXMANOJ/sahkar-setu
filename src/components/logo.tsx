import Link from "next/link";

/** A setu (bridge) arch over two piers, with a warn stamp for the keystone. */
export function LogoMark({ className = "size-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="var(--accent)" />
      <path d="M6 23V21a10 10 0 0 1 20 0v2" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M11 23v-3M21 23v-3M16 23v-4" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" opacity="0.7" />
      <circle cx="16" cy="9.5" r="3" fill="var(--warn)" />
    </svg>
  );
}

export function Logo({ href = "/", compact = false }: { href?: string; compact?: boolean }) {
  return (
    <Link href={href} className="flex items-center gap-2.5 rounded-lg" aria-label="Sahkar Setu home">
      <LogoMark />
      <span className={`text-base font-semibold leading-none tracking-[-0.01em] whitespace-nowrap ${compact ? "hidden sm:inline" : ""}`}>
        Sahkar Setu
      </span>
    </Link>
  );
}

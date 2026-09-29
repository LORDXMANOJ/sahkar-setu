import { useId } from "react";

export type StampTone = "accent" | "ok" | "danger" | "warn" | "ink";

const toneColor: Record<StampTone, string> = {
  accent: "#3346c8",
  ok: "#1e7a52",
  danger: "#c2412d",
  warn: "#b07400",
  ink: "#16204a",
};

/**
 * A rubber-stamp impression. The ink texture comes from an SVG turbulence
 * filter, so every stamp looks pressed rather than printed.
 */
export function Stamp({
  label,
  place,
  date,
  tone = "accent",
  className,
}: {
  label: string;
  place: string;
  date: string;
  tone?: StampTone;
  className?: string;
}) {
  const id = useId().replace(/:/g, "");
  const color = toneColor[tone];

  return (
    <svg viewBox="0 0 140 140" className={className} role="img" aria-label={`${label}, ${place}, ${date}`}>
      <defs>
        <filter id={`ink-${id}`} x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="2" seed="7" result="noise" />
          <feColorMatrix in="noise" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -0.9 1.3" result="mask" />
          <feComposite in="SourceGraphic" in2="mask" operator="in" result="inked" />
          <feDisplacementMap in="inked" in2="noise" scale="1.6" />
        </filter>
        <path id={`top-${id}`} d="M 22 70 A 48 48 0 0 1 118 70" />
        <path id={`bot-${id}`} d="M 28 76 A 42 42 0 0 0 112 76" />
      </defs>
      <g filter={`url(#ink-${id})`} fill="none" stroke={color} opacity="0.95">
        <circle cx="70" cy="70" r="64" strokeWidth="4" />
        <circle cx="70" cy="70" r="55" strokeWidth="1.5" />
        <text fill={color} stroke="none" fontSize="10.5" fontWeight="700" letterSpacing="2.2" fontFamily="var(--font-sans)">
          <textPath href={`#top-${id}`} startOffset="50%" textAnchor="middle">
            {place.toUpperCase()}
          </textPath>
        </text>
        <rect x="14" y="56" width="112" height="28" fill={color} stroke="none" rx="2" />
        <text
          x="70"
          y="75.5"
          textAnchor="middle"
          fill="#fffdf6"
          stroke="none"
          fontSize="16"
          fontWeight="800"
          fontFamily="var(--font-display)"
          style={{ fontVariationSettings: '"wdth" 80' }}
        >
          {label}
        </text>
        <text fill={color} stroke="none" fontSize="10" fontWeight="600" letterSpacing="1.5" fontFamily="var(--font-sans)">
          <textPath href={`#bot-${id}`} startOffset="50%" textAnchor="middle" dominantBaseline="hanging">
            {date}
          </textPath>
        </text>
      </g>
    </svg>
  );
}

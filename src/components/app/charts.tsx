"use client";

import { useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";

const nf = new Intl.NumberFormat("en-IN");

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  // Start narrow: a wide first paint makes phone browsers zoom the whole page out.
  const [width, setWidth] = useState(280);
  useLayoutEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.round(e.contentRect.width)));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

function niceMax(v: number) {
  if (v <= 0) return 1;
  const pow = 10 ** Math.floor(Math.log10(v));
  return Math.ceil(v / pow) * pow;
}

type Series = { key: string; label: string; color: string; dashed?: boolean };

function Swatch({ s }: { s: Series }) {
  return (
    <svg width="18" height="6" aria-hidden="true" className="shrink-0">
      <line x1="1" x2="17" y1="3" y2="3" stroke={s.color} strokeWidth="2.5" strokeLinecap="round" strokeDasharray={s.dashed ? "4 3" : undefined} />
    </svg>
  );
}

/**
 * Trend of up to two series: the first is solid with a soft area fill, the
 * second can be dashed. Crosshair tooltip, end labels and a table view mean
 * colour never carries the meaning alone.
 */
export function TrendChart<T extends Record<string, string | number>>({
  data,
  x,
  series,
  title,
  footer,
}: {
  data: T[];
  x: keyof T & string;
  series: Series[];
  title: string;
  footer?: ReactNode;
}) {
  const [wrap, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const tableId = useId();
  const gradId = useId().replace(/:/g, "");

  const h = 248;
  const m = { top: 14, right: 64, bottom: 28, left: 40 };
  const iw = Math.max(120, width - m.left - m.right);
  const ih = h - m.top - m.bottom;
  const max = niceMax(Math.max(...data.flatMap((d) => series.map((s) => Number(d[s.key])))));
  const xs = (i: number) => m.left + (data.length === 1 ? iw / 2 : (i / (data.length - 1)) * iw);
  const ys = (v: number) => m.top + ih - (v / max) * ih;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * max);
  const fmtTick = (t: number) => (t >= 1000 ? `${+(t / 1000).toFixed(2)}k` : String(t));

  function onMove(e: React.PointerEvent<SVGRectElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    const i = Math.round(((e.clientX - r.left) / r.width) * (data.length - 1));
    setHover(Math.max(0, Math.min(data.length - 1, i)));
  }

  const first = series[0];
  const areaPath =
    data.length > 1
      ? `M${xs(0)},${ys(Number(data[0][first.key]))} ` +
        data.map((d, i) => `L${xs(i)},${ys(Number(d[first.key]))}`).join(" ") +
        ` L${xs(data.length - 1)},${m.top + ih} L${xs(0)},${m.top + ih} Z`
      : "";

  return (
    <figure className="flex h-full flex-col">
      <figcaption className="mb-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <span className="text-[0.9375rem] font-semibold">{title}</span>
        <span className="flex flex-wrap gap-4 text-[0.8125rem] text-ink-soft" aria-hidden="true">
          {series.map((s) => (
            <span key={s.key} className="flex items-center gap-2">
              <Swatch s={s} />
              {s.label}
            </span>
          ))}
        </span>
      </figcaption>

      <div ref={wrap} className="relative min-w-0 overflow-hidden">
        <svg width={width} height={h} role="img" aria-describedby={tableId} aria-label={title} className="block overflow-visible">
          <defs>
            <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={first.color} stopOpacity="0.18" />
              <stop offset="100%" stopColor={first.color} stopOpacity="0" />
            </linearGradient>
          </defs>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={m.left} x2={m.left + iw} y1={ys(t)} y2={ys(t)} stroke="var(--line)" strokeWidth="1" strokeDasharray={t === 0 ? undefined : "2 4"} />
              <text x={m.left - 8} y={ys(t)} dy="0.32em" textAnchor="end" className="num fill-ink-faint text-[11px]">
                {fmtTick(t)}
              </text>
            </g>
          ))}
          {data.map((d, i) => (
            <text key={i} x={xs(i)} y={h - 6} textAnchor="middle" className="fill-ink-faint text-[11px]">
              {String(d[x])}
            </text>
          ))}

          {areaPath && <path d={areaPath} fill={`url(#${gradId})`} />}

          {series.map((s) => {
            const pts = data.map((d, i) => `${xs(i)},${ys(Number(d[s.key]))}`).join(" ");
            const last = data[data.length - 1];
            return (
              <g key={s.key}>
                <polyline
                  points={pts}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={s.dashed ? 2 : 2.5}
                  strokeDasharray={s.dashed ? "6 5" : undefined}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
                <circle cx={xs(data.length - 1)} cy={ys(Number(last[s.key]))} r="4" fill={s.color} stroke="var(--surface)" strokeWidth="2" />
                <text x={xs(data.length - 1) + 10} y={ys(Number(last[s.key]))} dy="0.32em" className="num fill-ink text-[12px] font-semibold">
                  {nf.format(Number(last[s.key]))}
                </text>
              </g>
            );
          })}

          {hover !== null && (
            <g pointerEvents="none">
              <line x1={xs(hover)} x2={xs(hover)} y1={m.top} y2={m.top + ih} stroke="var(--line-strong)" strokeWidth="1" />
              {series.map((s) => (
                <circle key={s.key} cx={xs(hover)} cy={ys(Number(data[hover][s.key]))} r="5" fill={s.color} stroke="var(--surface)" strokeWidth="2" />
              ))}
            </g>
          )}

          <rect x={m.left - 10} y={m.top} width={iw + 20} height={ih} fill="transparent" onPointerMove={onMove} onPointerLeave={() => setHover(null)} />
        </svg>

        {hover !== null && (
          <div
            className="pointer-events-none absolute top-1 z-10 min-w-40 rounded-lg bg-surface px-3 py-2.5 text-[0.8125rem] shadow-[var(--shadow-lift)] ring-1 ring-line"
            style={{ left: Math.min(Math.max(xs(hover) - 80, 0), width - 168) }}
          >
            <p className="mb-1.5 font-semibold">{String(data[hover][x])}</p>
            {series.map((s) => (
              <p key={s.key} className="flex items-center justify-between gap-4 py-0.5">
                <span className="flex items-center gap-2 text-ink-soft">
                  <Swatch s={s} />
                  {s.label}
                </span>
                <span className="num font-semibold">{nf.format(Number(data[hover][s.key]))}</span>
              </p>
            ))}
          </div>
        )}
      </div>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3 text-[0.8125rem]">
        <details className="group">
          <summary className="cursor-pointer text-accent hover:underline">Show as table</summary>
          <table id={tableId} className="mt-2 w-full min-w-64 text-left">
            <thead>
              <tr className="border-b border-line text-ink-faint">
                <th scope="col" className="py-1.5 pr-4 font-medium">{x === "month" ? "Month" : x}</th>
                {series.map((s) => (
                  <th key={s.key} scope="col" className="py-1.5 pl-4 text-right font-medium">{s.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((d, i) => (
                <tr key={i} className="border-b border-line">
                  <td className="py-1.5 pr-4">{String(d[x])}</td>
                  {series.map((s) => (
                    <td key={s.key} className="num py-1.5 pl-4 text-right">{nf.format(Number(d[s.key]))}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </details>
        {footer && <span className="text-ink-faint">{footer}</span>}
      </div>
    </figure>
  );
}

/**
 * Ranked horizontal bars for one measure. Rows in `flagged` are drawn in the
 * warning colour and labelled, so the flag never relies on colour alone.
 */
export function RankedBars({
  rows,
  title,
  flagged,
  flagLabel = "Needs attention",
  selected,
  format = (v) => `${v}%`,
}: {
  rows: { label: string; value: number; detail: string }[];
  title: string;
  flagged?: Set<string>;
  flagLabel?: string;
  selected?: string | null;
  format?: (v: number) => string;
}) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  const [hover, setHover] = useState<number | null>(null);

  return (
    <figure>
      <figcaption className="mb-4 text-[0.9375rem] font-semibold">{title}</figcaption>
      <ul className="space-y-3">
        {rows.map((r, i) => {
          const isFlag = flagged?.has(r.label) ?? false;
          const dim = (selected && selected !== r.label) || (hover !== null && hover !== i);
          return (
            <li
              key={r.label}
              className="relative"
              onPointerEnter={() => setHover(i)}
              onPointerLeave={() => setHover(null)}
            >
              <div className="mb-1 flex items-baseline justify-between gap-3 text-[0.8125rem]">
                <span className={`truncate ${selected === r.label ? "font-semibold text-ink" : "text-ink-soft"}`}>
                  {r.label}
                  {isFlag && <span className="ml-2 text-[0.75rem] font-medium text-warn-deep">{flagLabel}</span>}
                </span>
                <span className="num shrink-0 font-semibold">{format(r.value)}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-canvas">
                <div
                  className={`h-full rounded-full transition-opacity duration-150 ${isFlag ? "bg-warn" : "bg-series-1"}`}
                  style={{ width: `${(r.value / max) * 100}%`, opacity: dim ? 0.35 : 1 }}
                />
              </div>
              {hover === i && (
                <span className="pointer-events-none absolute -top-8 right-0 z-10 rounded-md bg-surface px-2.5 py-1 text-xs whitespace-nowrap shadow-[var(--shadow-lift)] ring-1 ring-line">
                  {r.detail}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </figure>
  );
}

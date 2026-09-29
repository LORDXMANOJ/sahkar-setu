"use client";

import { useId, useLayoutEffect, useRef, useState } from "react";

const nf = new Intl.NumberFormat("en-IN");

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(640);
  useLayoutEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.round(e.contentRect.width)));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

function niceMax(v: number) {
  const pow = 10 ** Math.floor(Math.log10(v));
  return Math.ceil(v / pow) * pow;
}

type Series = { key: string; label: string; color: string };

/** Two-series trend with a crosshair tooltip, legend, end labels and a table view. */
export function TrendChart<T extends Record<string, string | number>>({
  data,
  x,
  series,
  title,
}: {
  data: T[];
  x: keyof T & string;
  series: Series[];
  title: string;
}) {
  const [wrap, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const tableId = useId();

  const h = 260;
  const m = { top: 16, right: 76, bottom: 30, left: 44 };
  const iw = Math.max(120, width - m.left - m.right);
  const ih = h - m.top - m.bottom;
  const max = niceMax(Math.max(...data.flatMap((d) => series.map((s) => Number(d[s.key])))));
  const xs = (i: number) => m.left + (data.length === 1 ? iw / 2 : (i / (data.length - 1)) * iw);
  const ys = (v: number) => m.top + ih - (v / max) * ih;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * max);

  function onMove(e: React.PointerEvent<SVGRectElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - r.left;
    const i = Math.round((px / r.width) * (data.length - 1));
    setHover(Math.max(0, Math.min(data.length - 1, i)));
  }

  return (
    <figure>
      <figcaption className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <span className="font-semibold">{title}</span>
        <span className="flex flex-wrap gap-4 text-sm text-ink-soft" aria-hidden="true">
          {series.map((s) => (
            <span key={s.key} className="flex items-center gap-2">
              <span className="h-0.5 w-4 rounded-full" style={{ background: s.color }} />
              {s.label}
            </span>
          ))}
        </span>
      </figcaption>

      <div ref={wrap} className="relative">
        <svg width={width} height={h} role="img" aria-describedby={tableId} aria-label={title} className="block overflow-visible">
          {ticks.map((t) => (
            <g key={t}>
              <line x1={m.left} x2={m.left + iw} y1={ys(t)} y2={ys(t)} stroke="var(--line)" strokeWidth="1" />
              <text x={m.left - 8} y={ys(t)} dy="0.32em" textAnchor="end" className="num fill-ink-faint text-[11px]">
                {t >= 1000 ? `${t / 1000}k` : t}
              </text>
            </g>
          ))}
          {data.map((d, i) => (
            <text key={i} x={xs(i)} y={h - 8} textAnchor="middle" className="fill-ink-faint text-[11px]">
              {String(d[x])}
            </text>
          ))}

          {series.map((s) => {
            const pts = data.map((d, i) => `${xs(i)},${ys(Number(d[s.key]))}`).join(" ");
            const last = data[data.length - 1];
            return (
              <g key={s.key}>
                <polyline points={pts} fill="none" stroke={s.color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
                {/* Direct label at the line end, in text ink; the dot carries identity. */}
                <circle cx={xs(data.length - 1)} cy={ys(Number(last[s.key]))} r="4" fill={s.color} stroke="var(--surface)" strokeWidth="2" />
                <text x={xs(data.length - 1) + 10} y={ys(Number(last[s.key]))} dy="0.32em" className="num fill-ink text-[12px] font-semibold">
                  {nf.format(Number(last[s.key]))}
                </text>
              </g>
            );
          })}

          {hover !== null && (
            <g pointerEvents="none">
              <line x1={xs(hover)} x2={xs(hover)} y1={m.top} y2={m.top + ih} stroke="var(--ink-faint)" strokeDasharray="3 3" />
              {series.map((s) => (
                <circle key={s.key} cx={xs(hover)} cy={ys(Number(data[hover][s.key]))} r="5" fill={s.color} stroke="var(--surface)" strokeWidth="2" />
              ))}
            </g>
          )}

          <rect
            x={m.left - 10}
            y={m.top}
            width={iw + 20}
            height={ih}
            fill="transparent"
            onPointerMove={onMove}
            onPointerLeave={() => setHover(null)}
          />
        </svg>

        {hover !== null && (
          <div
            className="pointer-events-none absolute top-2 z-10 min-w-36 rounded-xl bg-ink px-3 py-2 text-sm text-canvas shadow-[var(--shadow-lift)]"
            style={{
              left: Math.min(Math.max(xs(hover) - 72, 0), width - 150),
            }}
          >
            <p className="font-semibold">{String(data[hover][x])}</p>
            {series.map((s) => (
              <p key={s.key} className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full" style={{ background: s.color }} />
                  {s.label}
                </span>
                <span className="num font-semibold">{nf.format(Number(data[hover][s.key]))}</span>
              </p>
            ))}
          </div>
        )}
      </div>

      <details className="mt-3 text-sm">
        <summary className="cursor-pointer text-ink-soft hover:text-ink">Show as table</summary>
        <table id={tableId} className="mt-2 w-full text-left">
          <thead>
            <tr className="border-b border-line text-ink-faint">
              <th scope="col" className="py-1.5 font-medium">{x === "month" ? "Month" : x}</th>
              {series.map((s) => (
                <th key={s.key} scope="col" className="py-1.5 text-right font-medium">{s.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((d, i) => (
              <tr key={i} className="border-b border-line">
                <td className="py-1.5">{String(d[x])}</td>
                {series.map((s) => (
                  <td key={s.key} className="num py-1.5 text-right">{nf.format(Number(d[s.key]))}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}

/** Ranked horizontal bars for a single measure, with per-bar hover detail. */
export function RankedBars({
  rows,
  title,
  format = (v) => `${v}%`,
}: {
  rows: { label: string; value: number; detail: string }[];
  title: string;
  format?: (v: number) => string;
}) {
  const max = Math.max(...rows.map((r) => r.value));
  const [hover, setHover] = useState<number | null>(null);

  return (
    <figure>
      <figcaption className="mb-4 font-semibold">{title}</figcaption>
      <ul className="space-y-2.5">
        {rows.map((r, i) => (
          <li
            key={r.label}
            className="relative grid grid-cols-[7.5rem_minmax(0,1fr)_3rem] items-center gap-3 text-sm"
            onPointerEnter={() => setHover(i)}
            onPointerLeave={() => setHover(null)}
          >
            <span className="truncate text-ink-soft">{r.label}</span>
            <span className="relative h-6">
              <span
                className="absolute inset-y-0 left-0 rounded-r-[4px] bg-series-1 transition-opacity"
                style={{ width: `${(r.value / max) * 100}%`, opacity: hover === null || hover === i ? 1 : 0.45 }}
              />
            </span>
            <span className="num text-right font-semibold">{format(r.value)}</span>
            {hover === i && (
              <span className="pointer-events-none absolute -top-9 left-[7.5rem] z-10 rounded-lg bg-ink px-2.5 py-1 text-xs whitespace-nowrap text-canvas shadow-[var(--shadow-lift)]">
                {r.detail}
              </span>
            )}
          </li>
        ))}
      </ul>
    </figure>
  );
}

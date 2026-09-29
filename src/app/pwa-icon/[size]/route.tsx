import { ImageResponse } from "next/og";

const SIZES = new Set([192, 512]);

// Home-screen icons, drawn from the same mark as the site logo.
export async function GET(_: Request, { params }: RouteContext<"/pwa-icon/[size]">) {
  const size = Number((await params).size);
  if (!SIZES.has(size)) return new Response("Not found", { status: 404 });

  return new ImageResponse(
    (
      <div style={{ width: size, height: size, background: "#3346c8", display: "flex", position: "relative" }}>
        <svg width={size} height={size} viewBox="0 0 32 32" style={{ position: "absolute", inset: 0 }}>
          <g transform="translate(3.2 3.2) scale(0.8)">
            <path d="M6 23V21a10 10 0 0 1 20 0v2" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
            <path d="M11 23v-3M21 23v-3M16 23v-4" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" opacity="0.7" />
            <circle cx="16" cy="9.5" r="3" fill="#f0b429" />
          </g>
        </svg>
      </div>
    ),
    { width: size, height: size, headers: { "Cache-Control": `public, max-age=${60 * 60 * 24 * 30}, immutable` } },
  );
}

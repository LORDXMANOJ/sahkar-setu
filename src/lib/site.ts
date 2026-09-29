// The site's public address, used in QR codes, links and metadata.
// Order: an explicit NEXT_PUBLIC_SITE_URL, then the production domain Vercel
// provides automatically, then nothing (callers fall back to the request).
export function configuredSiteUrl(): string | null {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercel) return `https://${vercel.replace(/\/$/, "")}`;
  return null;
}

export const siteUrl = () => configuredSiteUrl() ?? "http://localhost:3000";

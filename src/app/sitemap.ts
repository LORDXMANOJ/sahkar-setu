import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  return [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/verify`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/security`, changeFrequency: "yearly", priority: 0.3 },
  ];
}

import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sahkar Setu",
    short_name: "Sahkar Setu",
    description: "Cooperative training, certification and jobs, on one Skill Passport.",
    start_url: "/app",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f1f2ec",
    theme_color: "#16204a",
    lang: "en-IN",
    categories: ["education", "productivity"],
    icons: [
      { src: "/pwa-icon/192", sizes: "192x192", type: "image/png" },
      { src: "/pwa-icon/512", sizes: "512x512", type: "image/png" },
      { src: "/pwa-icon/512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Mark attendance", url: "/app/attendance" },
      { name: "Continue learning", url: "/app/learn" },
    ],
  };
}

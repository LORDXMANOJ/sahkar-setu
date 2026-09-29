import type { Metadata, Viewport } from "next";
import {
  Noto_Sans,
  Noto_Sans_Bengali,
  Noto_Sans_Devanagari,
  Noto_Sans_Gujarati,
  Noto_Sans_Gurmukhi,
  Noto_Sans_Kannada,
  Noto_Sans_Malayalam,
  Noto_Sans_Oriya,
  Noto_Sans_Tamil,
  Noto_Sans_Telugu,
} from "next/font/google";
import { Providers } from "@/components/providers";
import { getDictionary } from "@/lib/i18n/server";
import "./globals.css";

// One family for every script. Only Latin is preloaded; each script's file is
// fetched by the browser only when a page actually contains that script.
const noto = Noto_Sans({ variable: "--font-noto", subsets: ["latin"], display: "swap" });
const deva = Noto_Sans_Devanagari({ variable: "--font-noto-deva", subsets: ["devanagari"], display: "swap", preload: false });
const tamil = Noto_Sans_Tamil({ variable: "--font-noto-tamil", subsets: ["tamil"], display: "swap", preload: false });
const telugu = Noto_Sans_Telugu({ variable: "--font-noto-telugu", subsets: ["telugu"], display: "swap", preload: false });
const kannada = Noto_Sans_Kannada({ variable: "--font-noto-kannada", subsets: ["kannada"], display: "swap", preload: false });
const bengali = Noto_Sans_Bengali({ variable: "--font-noto-bengali", subsets: ["bengali"], display: "swap", preload: false });
const gujarati = Noto_Sans_Gujarati({ variable: "--font-noto-gujarati", subsets: ["gujarati"], display: "swap", preload: false });
const gurmukhi = Noto_Sans_Gurmukhi({ variable: "--font-noto-gurmukhi", subsets: ["gurmukhi"], display: "swap", preload: false });
const malayalam = Noto_Sans_Malayalam({ variable: "--font-noto-malayalam", subsets: ["malayalam"], display: "swap", preload: false });
const oriya = Noto_Sans_Oriya({ variable: "--font-noto-oriya", subsets: ["oriya"], display: "swap", preload: false });
const fontVars = [noto, deva, tamil, telugu, kannada, bengali, gujarati, gurmukhi, malayalam, oriya].map((f) => f.variable).join(" ");

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "Sahkar Setu: cooperative training, certification and jobs",
    template: "%s | Sahkar Setu",
  },
  description:
    "One Skill Passport from nomination to employment for cooperative trainees: offline lessons in their language, proxy-proof attendance, signed certificates and explainable job matching.",
  applicationName: "Sahkar Setu",
  appleWebApp: { capable: true, title: "Sahkar Setu", statusBarStyle: "default" },
  formatDetection: { telephone: false },
  openGraph: {
    type: "website",
    title: "Sahkar Setu",
    description: "From the training hall to a job, on one passport.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0b" },
  ],
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const { locale, t } = await getDictionary();

  return (
    <html lang={locale} className={fontVars}>
      <body className="min-h-dvh">
        <Providers locale={locale} t={t}>
          {children}
        </Providers>
      </body>
    </html>
  );
}

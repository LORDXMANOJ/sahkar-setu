import Link from "next/link";
import { getDictionary } from "@/lib/i18n/server";
import { LangSwitch } from "./lang-switch";
import { Logo } from "./logo";

export async function SiteHeader() {
  const { t } = await getDictionary();
  return (
    <>
      <a
        href="#main"
        className="fixed top-3 left-3 z-[60] -translate-y-20 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-canvas focus:translate-y-0"
      >
        {t.nav.skip}
      </a>
      <header
        style={{ viewTransitionName: "site-header" }}
        className="sticky top-0 z-50 border-b border-line/70 bg-canvas/80 pt-[env(safe-area-inset-top)] backdrop-blur-md supports-[not(backdrop-filter:blur(0))]:bg-canvas"
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6 lg:px-8">
          <Logo />
          <nav aria-label="Primary" className="ml-6 hidden items-center gap-1 text-sm font-medium md:flex">
            <Link href="/#programmes" className="rounded-full px-3 py-2 text-ink-soft transition-colors hover:text-ink">
              {t.nav.programmes}
            </Link>
            <Link href="/verify" className="rounded-full px-3 py-2 text-ink-soft transition-colors hover:text-ink">
              {t.nav.verify}
            </Link>
            <Link href="/app/employer" className="rounded-full px-3 py-2 text-ink-soft transition-colors hover:text-ink">
              {t.nav.employers}
            </Link>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <LangSwitch />
            <Link href="/app" className="btn btn-primary hidden sm:inline-flex" transitionTypes={["nav-forward"]}>
              {t.nav.open}
            </Link>
          </div>
        </div>
      </header>
    </>
  );
}

export async function SiteFooter() {
  const { t } = await getDictionary();
  return (
    <footer className="border-t border-line pb-[max(2.5rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 pt-10 sm:px-6 md:grid-cols-[minmax(0,1fr)_auto] lg:px-8">
        <div className="max-w-xl space-y-3">
          <Logo />
          <p className="text-sm text-ink-soft">{t.brandTag}</p>
          <p className="text-xs text-ink-faint">{t.footer.note}</p>
        </div>
        <nav aria-label="Footer" className="grid grid-cols-2 gap-x-10 gap-y-2 text-sm">
          <Link href="/app" className="text-ink-soft hover:text-ink">{t.nav.open}</Link>
          <Link href="/verify" className="text-ink-soft hover:text-ink">{t.nav.verify}</Link>
          <Link href="/app/employer" className="text-ink-soft hover:text-ink">{t.nav.employers}</Link>
          <Link href="/app/insights" className="text-ink-soft hover:text-ink">{t.app.insights}</Link>
          <Link href="/security" className="text-ink-soft hover:text-ink">Security</Link>
        </nav>
      </div>
    </footer>
  );
}

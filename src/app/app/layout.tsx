import type { Metadata } from "next";
import { Assistant } from "@/components/app/assistant";
import { SideNav, StaffMenu, TabBar } from "@/components/app/app-nav";
import { OfflineBanner } from "@/components/app/offline-banner";
import { LangSwitch } from "@/components/lang-switch";
import { Logo } from "@/components/logo";
import { getDictionary } from "@/lib/i18n/server";

export const metadata: Metadata = {
  title: "App",
  robots: { index: false, follow: false },
};

export default async function AppLayout({ children }: LayoutProps<"/app">) {
  const { t } = await getDictionary();
  return (
    <div className="lg:grid lg:min-h-dvh lg:grid-cols-[16rem_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-dvh flex-col gap-10 border-r border-line bg-surface/50 px-4 py-6 lg:flex">
        <div className="px-2">
          <Logo href="/" />
        </div>
        <SideNav />
        <div className="mt-auto space-y-3 px-2">
          <LangSwitch />
          <p className="flex items-center gap-2 text-xs text-ink-faint">
            <span className="inline-block size-1.5 rounded-full bg-warn" aria-hidden="true" />
            {t.app.demo}
          </p>
        </div>
      </aside>

      <div className="min-w-0">
        <header
          style={{ viewTransitionName: "site-header" }}
          className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-canvas/85 px-4 pt-[env(safe-area-inset-top)] backdrop-blur-md lg:hidden"
        >
          <Logo href="/" compact />
          <div className="ml-auto flex items-center gap-2">
            <StaffMenu />
            <LangSwitch />
          </div>
        </header>

        <main id="main" className="mx-auto max-w-6xl px-4 pt-6 pb-36 sm:px-6 lg:px-10 lg:pt-10 lg:pb-16">
          <OfflineBanner />
          {children}
        </main>
      </div>

      <TabBar />
      <Assistant />
    </div>
  );
}

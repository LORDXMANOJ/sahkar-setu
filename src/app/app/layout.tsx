import type { Metadata } from "next";
import { Assistant } from "@/components/app/assistant";
import { SideNav, StaffMenu, TabBar } from "@/components/app/app-nav";
import { OfflineBanner } from "@/components/app/offline-banner";
import { LangSwitch } from "@/components/lang-switch";
import { Logo } from "@/components/logo";
import { getDictionary } from "@/lib/i18n/server";
import { can, requireUser } from "@/lib/auth";
import { signOut } from "@/app/login/actions";
import { LogOut } from "lucide-react";

export const metadata: Metadata = {
  title: "App",
  robots: { index: false, follow: false },
};

export default async function AppLayout({ children }: LayoutProps<"/app">) {
  const { t } = await getDictionary();
  const user = await requireUser("/app");
  const access = {
    learn: can.learn(user),
    attendance: can.learn(user) || can.runSessions(user),
    hire: can.hire(user),
    insights: can.viewInsights(user),
  };
  const roleLabel = { demo: t.app.demo, trainee: "Trainee", trainer: "Trainer", employer: "Employer", admin: "Admin" }[user.role];
  const signOutButton = (
    <form action={signOut}>
      <button type="submit" className="btn btn-ghost h-9 min-h-0 w-full gap-1.5 px-3">
        <LogOut className="size-4" aria-hidden="true" />
        Sign out
      </button>
    </form>
  );
  return (
    <div className="app-theme min-h-dvh lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-dvh flex-col gap-10 border-r border-line bg-surface px-4 py-6 lg:flex">
        <div className="px-2">
          <Logo href="/" />
        </div>
        <SideNav access={access} />
        <div className="mt-auto space-y-3 px-2">
          <div className="rounded-lg bg-canvas p-3">
            <p className="truncate text-sm font-medium" data-no-translate>{user.name}</p>
            <p className="flex items-center gap-2 text-xs text-ink-faint">
              <span className={`inline-block size-1.5 rounded-full ${user.role === "demo" ? "bg-warn" : "bg-ok"}`} aria-hidden="true" />
              {roleLabel}
            </p>
            {user.role !== "demo" && <div className="mt-3">{signOutButton}</div>}
          </div>
          <LangSwitch />
        </div>
      </aside>

      <div className="min-w-0">
        <header
          style={{ viewTransitionName: "site-header" }}
          className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-canvas/85 px-4 pt-[env(safe-area-inset-top)] backdrop-blur-md lg:hidden"
        >
          <Logo href="/" compact />
          <div className="ml-auto flex items-center gap-2">
            <StaffMenu access={access} />
            <LangSwitch />
            {user.role !== "demo" && (
              <form action={signOut}>
                <button type="submit" aria-label="Sign out" className="btn btn-ghost size-9 min-h-0 p-0">
                  <LogOut className="size-4" aria-hidden="true" />
                </button>
              </form>
            )}
          </div>
        </header>

        <main id="main" className="mx-auto max-w-6xl px-4 pt-6 pb-36 sm:px-6 lg:px-10 lg:pt-10 lg:pb-16">
          <OfflineBanner />
          {children}
        </main>
      </div>

      <TabBar access={access} />
      {access.learn && <Assistant />}
    </div>
  );
}

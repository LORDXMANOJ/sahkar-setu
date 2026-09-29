"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Briefcase, GraduationCap, House, QrCode, Users } from "lucide-react";
import { useI18n } from "../providers";

function useItems() {
  const { t } = useI18n();
  return {
    trainee: [
      { href: "/app", label: t.app.home, Icon: House },
      { href: "/app/learn", label: t.app.learn, Icon: GraduationCap },
      { href: "/app/attendance", label: t.app.attendance, Icon: QrCode },
      { href: "/app/jobs", label: t.app.jobs, Icon: Briefcase },
    ],
    staff: [
      { href: "/app/employer", label: t.app.employer, Icon: Users },
      { href: "/app/insights", label: t.app.insights, Icon: BarChart3 },
    ],
  };
}

function isActive(pathname: string, href: string) {
  return href === "/app" ? pathname === "/app" : pathname.startsWith(href);
}

export function SideNav() {
  const pathname = usePathname();
  const { trainee, staff } = useItems();

  const link = ({ href, label, Icon }: (typeof trainee)[number]) => {
    const active = isActive(pathname, href);
    return (
      <li key={href}>
        <Link
          href={href}
          aria-current={active ? "page" : undefined}
          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[0.9375rem] font-medium transition-colors ${
            active ? "bg-ink text-canvas" : "text-ink-soft hover:bg-line/50 hover:text-ink"
          }`}
        >
          <Icon className="size-[1.125rem]" aria-hidden="true" />
          {label}
        </Link>
      </li>
    );
  };

  return (
    <nav aria-label="App" className="space-y-8">
      <div>
        <p className="px-3 pb-2 text-xs font-medium text-ink-faint">Trainee</p>
        <ul className="space-y-1">{trainee.map(link)}</ul>
      </div>
      <div>
        <p className="px-3 pb-2 text-xs font-medium text-ink-faint">Staff</p>
        <ul className="space-y-1">{staff.map(link)}</ul>
      </div>
    </nav>
  );
}

/** Thumb-reachable tab bar for phones. */
export function TabBar() {
  const pathname = usePathname();
  const { trainee } = useItems();

  return (
    <nav
      aria-label="App"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-canvas/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
    >
      <ul className="mx-auto grid max-w-md grid-cols-4">
        {trainee.map(({ href, label, Icon }) => {
          const active = isActive(pathname, href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-16 flex-col items-center justify-center gap-1 text-[0.75rem] font-medium transition-colors select-none ${
                  active ? "text-accent" : "text-ink-soft"
                }`}
              >
                <span className={`grid h-7 w-12 place-items-center rounded-full transition-colors ${active ? "bg-accent-wash" : ""}`}>
                  <Icon className="size-5" aria-hidden="true" strokeWidth={active ? 2.4 : 2} />
                </span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Staff views on phones live behind a small menu in the top bar. */
export function StaffMenu() {
  const { staff } = useItems();
  return (
    <details className="group relative lg:hidden">
      <summary className="btn btn-ghost h-10 min-h-0 cursor-pointer list-none px-4 [&::-webkit-details-marker]:hidden">
        Staff
      </summary>
      <ul className="absolute right-0 z-50 mt-2 w-48 rounded-xl bg-surface p-1.5 shadow-[var(--shadow-lift)] ring-1 ring-line">
        {staff.map(({ href, label, Icon }) => (
          <li key={href}>
            <Link href={href} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-line/50">
              <Icon className="size-4" aria-hidden="true" />
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </details>
  );
}

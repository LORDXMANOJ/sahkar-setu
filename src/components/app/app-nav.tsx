"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Briefcase, GraduationCap, House, QrCode, Users } from "lucide-react";
import { useI18n } from "../providers";

export type Access = { learn: boolean; attendance: boolean; hire: boolean; insights: boolean };

function useItems(access: Access) {
  const { t } = useI18n();
  const trainee = [
    { href: "/app", label: t.app.home, Icon: House, show: access.learn },
    { href: "/app/learn", label: t.app.learn, Icon: GraduationCap, show: access.learn },
    { href: "/app/attendance", label: t.app.attendance, Icon: QrCode, show: access.attendance },
    { href: "/app/jobs", label: t.app.jobs, Icon: Briefcase, show: access.learn },
  ].filter((i) => i.show);
  const staff = [
    { href: "/app/employer", label: t.app.employer, Icon: Users, show: access.hire },
    { href: "/app/insights", label: t.app.insights, Icon: BarChart3, show: access.insights },
  ].filter((i) => i.show);
  return { trainee, staff };
}

function isActive(pathname: string, href: string) {
  return href === "/app" ? pathname === "/app" : pathname.startsWith(href);
}

export function SideNav({ access }: { access: Access }) {
  const pathname = usePathname();
  const { trainee, staff } = useItems(access);

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
      {trainee.length > 0 && (
        <div>
          <p className="px-3 pb-2 text-xs font-medium text-ink-faint">{access.learn ? "Trainee" : "Classes"}</p>
          <ul className="space-y-1">{trainee.map(link)}</ul>
        </div>
      )}
      {staff.length > 0 && (
        <div>
          <p className="px-3 pb-2 text-xs font-medium text-ink-faint">Staff</p>
          <ul className="space-y-1">{staff.map(link)}</ul>
        </div>
      )}
    </nav>
  );
}

/** Thumb-reachable tab bar for phones. */
export function TabBar({ access }: { access: Access }) {
  const pathname = usePathname();
  const { trainee: t, staff } = useItems(access);
  // Trainees get their four tabs; staff get their own pages as tabs.
  const trainee = access.learn ? t : [...t, ...staff];

  return (
    <nav
      aria-label="App"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-canvas/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
    >
      <ul className="mx-auto flex max-w-md [&>li]:flex-1">
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
export function StaffMenu({ access }: { access: Access }) {
  const { staff } = useItems(access);
  if (!access.learn || staff.length === 0) return null;
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

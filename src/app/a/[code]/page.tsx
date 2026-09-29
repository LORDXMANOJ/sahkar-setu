import type { Metadata } from "next";
import Link from "next/link";
import { CircleX } from "lucide-react";
import { CheckInForm } from "@/components/app/check-in-form";
import { Logo } from "@/components/logo";
import { formatCode, sessionByCode } from "@/lib/attendance";

export const metadata: Metadata = { title: "Mark attendance", robots: { index: false, follow: false } };

// Opening a shared attendance link shows the session and asks for one tap.
// Nothing is marked on page load, so link previews can't mark anyone present.
export default async function AttendanceLink({ params }: PageProps<"/a/[code]">) {
  const { code } = await params;
  const session = sessionByCode(code);

  return (
    <main id="main" className="mx-auto flex min-h-dvh max-w-md flex-col px-4 py-8">
      <Logo />
      <div className="panel mt-8 p-6">
        {session ? (
          <>
            <p className="text-sm text-ink-soft">Attendance for</p>
            <h1 className="mt-1 text-2xl font-semibold">{session.title}</h1>
            <p className="text-ink-soft">
              {session.room}, code <span className="num font-medium text-ink" data-no-translate>{formatCode(session.code)}</span>
            </p>
            <div className="mt-6">
              <CheckInForm initialCode={session.code} fromLink />
            </div>
          </>
        ) : (
          <>
            <CircleX className="size-10 text-danger" aria-hidden="true" />
            <h1 className="mt-3 text-2xl font-semibold">This attendance link isn&apos;t open</h1>
            <p className="mt-2 text-ink-soft">The session may have ended, or the trainer made a new code. Ask for the current code.</p>
            <Link href="/app/attendance" className="btn btn-primary mt-6">
              Enter a code
            </Link>
          </>
        )}
      </div>
    </main>
  );
}

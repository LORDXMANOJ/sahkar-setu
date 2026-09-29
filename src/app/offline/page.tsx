import type { Metadata } from "next";
import Link from "next/link";
import { CloudOff } from "lucide-react";

export const metadata: Metadata = { title: "Offline", robots: { index: false } };

export default function Offline() {
  return (
    <main id="main" className="mx-auto grid min-h-dvh max-w-md place-items-center px-6 text-center">
      <div>
        <CloudOff className="mx-auto size-12 text-ink-faint" aria-hidden="true" />
        <h1 className="display mt-6 text-3xl">No signal right now</h1>
        <p className="mt-3 text-ink-soft">
          This page hasn&apos;t been saved on your phone yet. Your lessons and quizzes are, and anything you answer will sync when
          you&apos;re back online.
        </p>
        <Link href="/app/learn" className="btn btn-primary mt-8">
          Open my lessons
        </Link>
      </div>
    </main>
  );
}

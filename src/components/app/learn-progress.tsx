"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { completedLessons } from "@/lib/offline-queue";
import { Meter } from "./ui";

const subscribe = (cb: () => void) => {
  window.addEventListener("storage", cb);
  return () => window.removeEventListener("storage", cb);
};

/** Reads lesson completion from the phone, so it is right even offline. */
export function LearnProgress({ lessonIds, firstHref }: { lessonIds: string[]; firstHref: string }) {
  const doneJson = useSyncExternalStore(
    subscribe,
    () => JSON.stringify(completedLessons()),
    () => "{}",
  );
  const done = JSON.parse(doneJson) as Record<string, number>;
  const count = lessonIds.filter((id) => id in done).length;
  const pct = Math.round((count / lessonIds.length) * 100);
  const next = lessonIds.find((id) => !(id in done));

  return (
    <div>
      <div className="flex items-baseline justify-between text-sm">
        <span className="text-ink-soft">
          <span className="num font-semibold text-ink">{count}</span> of {lessonIds.length} lessons
        </span>
        <span className="num font-semibold">{pct}%</span>
      </div>
      <div className="mt-2">
        <Meter value={pct} tone="ok" label="Lessons completed" />
      </div>
      <Link href={next ? `/app/learn/${next}` : firstHref} transitionTypes={["nav-forward"]} className="btn btn-primary mt-5 w-full sm:w-auto">
        {count === 0 ? "Start learning" : next ? "Continue" : "Review lessons"}
      </Link>
    </div>
  );
}

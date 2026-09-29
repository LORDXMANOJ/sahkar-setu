import type { Metadata } from "next";
import Link from "next/link";
import { Clock } from "lucide-react";
import { LearnProgress } from "@/components/app/learn-progress";
import { PageHeader } from "@/components/app/ui";
import { PageTransition } from "@/components/page-transition";
import { getInstitute, getProgramme, lessons } from "@/lib/data";

export const metadata: Metadata = { title: "Learn" };

export default function LearnPage() {
  const programme = getProgramme("milk-quality")!;
  const list = lessons["milk-quality"];
  const inst = getInstitute(programme.instituteId)!;

  return (
    <PageTransition>
      <PageHeader title={programme.title} body={`${inst.short}. Lessons are saved on your phone, so you can read and take quizzes without a signal.`} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <ol className="panel divide-y divide-line">
          {list.map((l, i) => (
            <li key={l.id}>
              <Link
                href={`/app/learn/${l.id}`}
                transitionTypes={["nav-forward"]}
                className="grid grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-4 px-5 py-5 transition-colors hover:bg-line/30 sm:px-6"
              >
                <span className="num grid size-10 place-items-center rounded-full bg-canvas text-sm font-bold shadow-[inset_0_0_0_1.5px_var(--line-strong)]">
                  {i + 1}
                </span>
                <span>
                  <span className="block font-semibold">{l.title}</span>
                  <span className="flex items-center gap-1.5 text-sm text-ink-soft">
                    <Clock className="size-3.5" aria-hidden="true" />
                    {l.minutes} min, {l.quiz.length} {l.quiz.length === 1 ? "question" : "questions"}
                  </span>
                </span>
                <span className="text-sm font-semibold text-accent">Open</span>
              </Link>
            </li>
          ))}
        </ol>

        <aside className="panel h-fit p-5 sm:p-6">
          <h2 className="font-semibold">Your progress</h2>
          <div className="mt-4">
            <LearnProgress lessonIds={list.map((l) => l.id)} firstHref={`/app/learn/${list[0].id}`} />
          </div>
          <div className="mt-6 border-t border-line pt-5">
            <h2 className="font-semibold">Final assessment</h2>
            <p className="mt-1 text-sm text-ink-soft">A monitored exam covering all lessons.</p>
            <Link href="/app/exam" transitionTypes={["nav-forward"]} className="btn btn-ghost mt-4 w-full">
              Take the exam
            </Link>
          </div>
        </aside>
      </div>
    </PageTransition>
  );
}

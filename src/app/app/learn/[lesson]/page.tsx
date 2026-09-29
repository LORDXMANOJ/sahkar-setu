import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { LessonView } from "@/components/app/lesson-view";
import { PageTransition } from "@/components/page-transition";
import { lessons } from "@/lib/data";

const list = lessons["milk-quality"];

export async function generateMetadata({ params }: PageProps<"/app/learn/[lesson]">): Promise<Metadata> {
  const { lesson } = await params;
  return { title: list.find((l) => l.id === lesson)?.title ?? "Lesson" };
}

export default async function LessonPage({ params }: PageProps<"/app/learn/[lesson]">) {
  const { lesson: id } = await params;
  const index = list.findIndex((l) => l.id === id);
  if (index === -1) notFound();
  const next = list[index + 1];

  return (
    <PageTransition>
      <Link href="/app/learn" transitionTypes={["nav-back"]} className="inline-flex items-center gap-2 text-sm font-medium text-ink-soft hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden="true" />
        All lessons
      </Link>
      <LessonView lesson={list[index]} number={index + 1} of={list.length} nextId={next?.id} />
    </PageTransition>
  );
}

import type { Metadata } from "next";
import { Exam } from "@/components/app/exam";
import { PageHeader } from "@/components/app/ui";
import { PageTransition } from "@/components/page-transition";
import { lessons } from "@/lib/data";
import { can, requireRole } from "@/lib/auth";

export const metadata: Metadata = { title: "Final assessment" };

export default async function ExamPage() {
  const user = await requireRole(can.learn, "/app/exam");
  const questions = lessons["milk-quality"].flatMap((l) => l.quiz);
  return (
    <PageTransition>
      <PageHeader title="Final assessment" body="Milk quality testing and collection centre operations. Answer every question, then submit." />
      <Exam questions={questions} demo={user.role === "demo"} />
    </PageTransition>
  );
}

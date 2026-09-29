import type { Metadata } from "next";
import { InsightsDashboard, type ExamRow, type RiskRow } from "@/components/app/insights-dashboard";
import { PageTransition } from "@/components/page-transition";
import { can, requireRole } from "@/lib/auth";
import { getTrainee, monthlyTrained, stateOutreach, trainees } from "@/lib/data";
import { dropoutRisk } from "@/lib/insights";
import { integritySummary } from "@/lib/store";

export const metadata: Metadata = { title: "Insights" };

export default async function InsightsPage() {
  await requireRole(can.viewInsights, "/app/insights");

  const risks: RiskRow[] = trainees.map((t) => {
    const r = dropoutRisk(t);
    return {
      id: t.id,
      name: t.name,
      society: t.society,
      district: t.district,
      state: t.state,
      phone: t.phone,
      level: r.level,
      score: r.score,
      factors: r.factors,
      daysInactive: t.daysInactive,
    };
  });

  const exams: ExamRow[] = (await integritySummary()).map((e) => ({
    key: e.examId + e.traineeId,
    name: getTrainee(e.traineeId)?.name ?? e.traineeId,
    left: e.left,
    awaySec: Math.round(e.awayMs / 1000),
    pastes: e.pastes,
    submitted: e.submitted,
  }));

  return (
    <PageTransition>
      <InsightsDashboard months={monthlyTrained} states={stateOutreach} risks={risks} exams={exams} />
    </PageTransition>
  );
}

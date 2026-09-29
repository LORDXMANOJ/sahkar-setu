import type { Metadata } from "next";
import { Suspense } from "react";
import { AttendancePanels } from "@/components/app/attendance-panels";
import { PageHeader } from "@/components/app/ui";
import { PageTransition } from "@/components/page-transition";
import { can, requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Attendance" };

export default async function AttendancePage() {
  const user = await requireUser("/app/attendance");
  return (
    <PageTransition>
      <PageHeader
        title="Attendance"
        body="One code per class. Trainees type it, open the link, or scan the QR, and only phones on the classroom Wi-Fi are accepted. One phone can mark only one person."
      />
      <Suspense>
        <AttendancePanels demo={user.role === "demo"} trainee={Boolean(user.traineeId)} trainer={can.runSessions(user)} />
      </Suspense>
    </PageTransition>
  );
}

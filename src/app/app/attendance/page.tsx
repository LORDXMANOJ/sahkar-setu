import type { Metadata } from "next";
import { Suspense } from "react";
import { AttendancePanels } from "@/components/app/attendance-panels";
import { PageHeader } from "@/components/app/ui";
import { PageTransition } from "@/components/page-transition";

export const metadata: Metadata = { title: "Attendance" };

export default function AttendancePage() {
  return (
    <PageTransition>
      <PageHeader
        title="Attendance"
        body="One code per class. Trainees type it, open the link, or scan the QR, and only phones on the classroom Wi-Fi are accepted. One phone can mark only one person."
      />
      <Suspense>
        <AttendancePanels />
      </Suspense>
    </PageTransition>
  );
}

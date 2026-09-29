"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { can, getCurrentUser } from "@/lib/auth";
import { programmes } from "@/lib/data";
import { allJobs, apply, postJob } from "@/lib/store";

export async function applyToJob(jobId: string) {
  const user = await getCurrentUser();
  if (!user?.traineeId) return { ok: false as const, message: "Sign in as a trainee to apply." };
  if (typeof jobId !== "string" || !(await allJobs()).some((j) => j.id === jobId)) {
    return { ok: false as const, message: "That job is no longer open." };
  }
  await apply(jobId, user.traineeId);
  revalidatePath("/app/jobs");
  revalidatePath("/app/employer");
  return { ok: true as const };
}

const knownSkills = new Set(programmes.flatMap((p) => p.skills));
const clean = (s: string) => s.replace(/[\u0000-\u001f<>]/g, "").trim();

const JobForm = z.object({
  title: z.string().transform(clean).pipe(z.string().min(4, "Give the job a title of at least 4 characters.").max(80)),
  employer: z.string().transform(clean).pipe(z.string().min(3, "Add the employer's name.").max(80)),
  district: z.string().transform(clean).pipe(z.string().min(2, "Add the district.").max(40)),
  state: z.string().transform(clean).pipe(z.string().min(2, "Add the state.").max(40)),
  kind: z.enum(["Full time", "Seasonal", "Apprenticeship", "Enterprise support"]),
  pay: z.string().transform(clean).pipe(z.string().min(2, "Say what the job pays.").max(40)),
  openings: z.coerce.number().int().min(1, "At least one opening.").max(500),
  skills: z.array(z.string()).min(1, "Pick at least one skill.").max(8).refine((s) => s.every((x) => knownSkills.has(x)), "Pick skills from the list."),
});

export type PostJobState = { ok?: boolean; errors?: Record<string, string>; jobId?: string };

export async function postJobAction(_: PostJobState, form: FormData): Promise<PostJobState> {
  const user = await getCurrentUser();
  if (!user || !can.hire(user)) return { errors: { form: "Only employers can post jobs." } };
  const parsed = JobForm.safeParse({
    title: form.get("title") ?? "",
    employer: form.get("employer") ?? "",
    district: form.get("district") ?? "",
    state: form.get("state") ?? "",
    kind: form.get("kind"),
    pay: form.get("pay") ?? "",
    openings: form.get("openings"),
    skills: form.getAll("skills"),
  });
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      errors[key] ??= issue.message;
    }
    return { errors };
  }
  const job = await postJob(parsed.data, user.id);
  revalidatePath("/app/employer");
  revalidatePath("/app/jobs");
  return { ok: true, jobId: job.id };
}

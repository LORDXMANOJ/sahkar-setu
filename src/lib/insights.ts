import { certificatesFor, getProgramme, type Job, type Trainee } from "./data";

// Explainable scoring. Every score comes with the reasons behind it, so a
// trainee, trainer or employer can see why, and argue with it.

export type Match = {
  score: number; // 0–100
  matched: string[];
  missing: string[];
  reasons: string[];
};

export function matchJob(trainee: Trainee, job: Job): Match {
  const certSkills = new Set(
    certificatesFor(trainee.id).flatMap((c) => getProgramme(c.programmeSlug)?.skills ?? []),
  );
  const have = new Set([...trainee.skills, ...certSkills]);

  const matched = job.skills.filter((s) => have.has(s));
  const missing = job.skills.filter((s) => !have.has(s));
  const certified = matched.filter((s) => certSkills.has(s));

  // Skills carry most of the weight; a certified skill counts more than a claimed one.
  const skillScore = job.skills.length
    ? (matched.length + certified.length * 0.5) / (job.skills.length * 1.5)
    : 0;
  const sameDistrict = job.district === trainee.district;
  const sameState = job.state === trainee.state || job.state === "All states";
  const place = sameDistrict ? 1 : sameState ? 0.6 : 0.15;

  const score = Math.round(Math.min(1, skillScore * 0.8 + place * 0.2) * 100);

  const reasons: string[] = [];
  if (certified.length) reasons.push(`Certified in ${certified.join(", ")}`);
  const claimed = matched.filter((s) => !certSkills.has(s));
  if (claimed.length) reasons.push(`Has worked with ${claimed.join(", ")}`);
  if (sameDistrict) reasons.push(`Lives in ${job.district}`);
  else if (sameState && job.state !== "All states") reasons.push(`Same state (${job.state})`);

  return { score, matched, missing, reasons };
}

export type Risk = {
  level: "low" | "watch" | "high";
  score: number; // 0–100, higher means more likely to drop out
  factors: string[];
};

export function dropoutRisk(t: Trainee): Risk {
  const factors: string[] = [];
  let score = 0;

  if (t.attendancePct < 75) {
    score += 35;
    factors.push(`Attendance ${t.attendancePct}%, below the 75% needed for a certificate`);
  } else if (t.attendancePct < 85) {
    score += 15;
    factors.push(`Attendance ${t.attendancePct}%`);
  }

  const first = t.quizTrend[0];
  const last = t.quizTrend[t.quizTrend.length - 1];
  const slope = last - first;
  if (slope <= -10) {
    score += 30;
    factors.push(`Quiz scores fell from ${first} to ${last}`);
  } else if (slope < 0) {
    score += 12;
    factors.push(`Quiz scores slipping (${first} → ${last})`);
  }

  if (t.daysInactive >= 14) {
    score += 30;
    factors.push(`No activity for ${t.daysInactive} days`);
  } else if (t.daysInactive >= 7) {
    score += 15;
    factors.push(`Inactive for ${t.daysInactive} days`);
  }

  score = Math.min(100, score);
  const level = score >= 55 ? "high" : score >= 25 ? "watch" : "low";
  if (!factors.length) factors.push("Attending, active and improving");
  return { level, score, factors };
}

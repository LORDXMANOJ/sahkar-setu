import type { Metadata } from "next";
import { PageTransition } from "@/components/page-transition";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";

export const metadata: Metadata = {
  title: "Security and privacy",
  description: "How Sahkar Setu protects trainee data, certificates and attendance.",
};

const sections = [
  {
    title: "Certificates can't be forged",
    points: [
      "Each certificate is signed with the council's Ed25519 private key. The QR code on it carries that signature.",
      "Changing any field, such as the name, score or date, breaks the signature, and the verify page says the document was altered.",
      "The public key can be published, so banks and employers can check certificates without asking us.",
    ],
  },
  {
    title: "Attendance can't be proxied",
    points: [
      "The trainer's QR code is an HMAC-SHA256 token that changes every 20 seconds, and only the server holds the key.",
      "Old codes, edited codes and codes from other sessions are rejected. Comparisons run in constant time.",
      "Each trainee can be marked once per session.",
    ],
  },
  {
    title: "The browser only runs our code",
    points: [
      "A strict Content Security Policy with a fresh nonce on every request blocks injected scripts, and nothing loads from other sites.",
      "Pages can't be framed (clickjacking), MIME sniffing is off, HTTPS is enforced with HSTS, and only our own pages may use the camera or microphone.",
      "Fonts are served from our own domain, so no third party learns who is reading what.",
    ],
  },
  {
    title: "Every input is checked on the server",
    points: [
      "All API bodies and forms are validated with strict schemas, with size limits, before anything is stored.",
      "Requests from other sites are refused, and every endpoint is rate limited per client.",
      "Signing keys live only in server code, enforced at build time, and never reach the phone.",
    ],
  },
  {
    title: "Trainee data stays with the trainee",
    points: [
      "In production, Postgres row-level security means a trainee can read only their own record, an institute only its own programmes, and an employer only candidates who applied or opted in to discovery.",
      "Aadhaar numbers are never stored. Phone numbers are kept only for SMS alerts and can be deleted by the trainee.",
      "The design follows India's Digital Personal Data Protection Act, 2023: collect only what's needed, with consent, and allow correction and deletion.",
    ],
  },
  {
    title: "The career assistant is contained",
    points: [
      "Sahayak sees only the signed-in trainee's own record, built on the server. It can't query other trainees.",
      "Messages are limited in length and number, and the assistant has no tools that change data.",
    ],
  },
];

export default function SecurityPage() {
  return (
    <>
      <SiteHeader />
      <PageTransition>
        <main id="main" className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
          <h1 className="display text-3xl sm:text-4xl">Security and privacy</h1>
          <p className="mt-5 text-lg text-ink-soft">
            Sahkar Setu holds records that decide whether someone gets a job. Here is how they are protected.
          </p>
          <div className="mt-14 space-y-12">
            {sections.map((s) => (
              <section key={s.title}>
                <h2 className="text-xl font-semibold">{s.title}</h2>
                <ul className="mt-4 space-y-3 text-ink-soft">
                  {s.points.map((p) => (
                    <li key={p} className="flex gap-3">
                      <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </main>
      </PageTransition>
      <SiteFooter />
    </>
  );
}

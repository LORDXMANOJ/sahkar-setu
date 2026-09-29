import type { Metadata } from "next";
import Link from "next/link";
import QRCode from "qrcode";
import { headers } from "next/headers";
import { ArrowLeft, BadgeCheck, SearchX, ShieldAlert } from "lucide-react";
import { PageTransition } from "@/components/page-transition";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { VerifyForm } from "@/components/verify-form";
import { verifyCertificate } from "@/lib/crypto";

export const metadata: Metadata = {
  title: "Certificate check",
  robots: { index: false, follow: false },
};

function safeDecode(v: string) {
  try {
    return decodeURIComponent(v);
  } catch {
    return v;
  }
}

/** Prefer the configured site URL; the Host header is client-controlled. */
async function siteOrigin() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  const host = (await headers()).get("host") ?? "localhost:3000";
  return `${host.startsWith("localhost") ? "http" : "https"}://${host}`;
}

const longDate = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric" });

export default async function VerifyResult({ params, searchParams }: PageProps<"/verify/[code]">) {
  const { code } = await params;
  const { sig } = await searchParams;
  const result = verifyCertificate(safeDecode(code), typeof sig === "string" ? sig : null);

  return (
    <>
      <SiteHeader />
      <PageTransition>
        <main id="main" className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
          <Link
            href="/verify"
            transitionTypes={["nav-back"]}
            className="inline-flex items-center gap-2 text-sm font-medium text-ink-soft hover:text-ink"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Check another certificate
          </Link>

          {result.status === "valid" ? (
            <Valid result={result} signatureChecked={typeof sig === "string"} />
          ) : result.status === "tampered" ? (
            <Problem
              tone="danger"
              title="This certificate has been altered"
              body={`The ID ${result.id} exists, but the signature in this QR code does not match the council's record. Treat the document as forged and report it to the issuing institute.`}
            />
          ) : (
            <Problem
              tone="neutral"
              title="No certificate has this ID"
              body={`We couldn't find "${result.id}". Check the ID printed in the top-right corner of the certificate. It looks like NCCT-2026-GNR-0412.`}
            />
          )}
        </main>
      </PageTransition>
      <SiteFooter />
    </>
  );
}

async function Valid({
  result,
  signatureChecked,
}: {
  result: Extract<ReturnType<typeof verifyCertificate>, { status: "valid" }>;
  signatureChecked: boolean;
}) {
  const { certificate: c, trainee, programme, institute } = result;
  const origin = await siteOrigin();
  const signedUrl = `${origin}/verify/${c.id}?sig=${result.signature}`;
  const qr = await QRCode.toString(signedUrl, {
    type: "svg",
    margin: 0,
    errorCorrectionLevel: "M",
    color: { dark: "#16204a", light: "#00000000" },
  });

  return (
    <div className="mt-8">
      <div className="rise flex items-start gap-4 rounded-xl bg-ok-wash p-5 text-ok sm:items-center">
        <BadgeCheck className="size-8 shrink-0" aria-hidden="true" />
        <div>
          <h1 className="text-xl font-semibold">Genuine certificate</h1>
          <p className="mt-0.5 text-sm text-ink-soft">
            {signatureChecked
              ? "The signature in this QR code matches the council's record."
              : "This ID is in the council's register. Scan the printed QR code to check its signature too."}
          </p>
        </div>
      </div>

      {/* The certificate as a document */}
      <article className="paper rise relative mt-6 overflow-hidden rounded-xl p-6 shadow-[var(--shadow-lift)] ring-1 ring-[#16204a]/10 [animation-delay:80ms] sm:p-10">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#16204a]/15 pb-5">
          <div>
            <p className="text-sm text-[#4a5275]">National Council for Cooperative Training</p>
            <p className="text-sm text-[#4a5275]">{institute.short}, {institute.city}</p>
          </div>
          <p className="num text-sm font-semibold tracking-wide">{c.id}</p>
        </div>

        <div className="grid gap-8 pt-8 sm:grid-cols-[minmax(0,1fr)_9rem]">
          <div>
            <p className="text-sm text-[#4a5275]">This certifies that</p>
            <h2 className="display mt-1 text-[2rem] leading-tight">{trainee.name}</h2>
            <p className="mt-1 text-sm text-[#4a5275]">{trainee.society}, {trainee.district}</p>

            <p className="mt-6 text-sm text-[#4a5275]">completed the {programme.days}-day programme</p>
            <p className="mt-1 text-lg font-semibold">{programme.title}</p>

            <dl className="mt-8 grid grid-cols-3 gap-4 border-t border-[#16204a]/15 pt-5 text-sm">
              <div>
                <dt className="text-[#7d839c]">Result</dt>
                <dd className="font-semibold">{c.grade}</dd>
              </div>
              <div>
                <dt className="text-[#7d839c]">Score</dt>
                <dd className="num font-semibold">{c.score}%</dd>
              </div>
              <div>
                <dt className="text-[#7d839c]">Attendance</dt>
                <dd className="num font-semibold">{c.attendancePct}%</dd>
              </div>
            </dl>
            <p className="mt-5 text-sm text-[#4a5275]">Issued on {longDate.format(new Date(c.issuedOn))}</p>
          </div>

          <div className="flex flex-col items-start gap-3 sm:items-center">
            <div className="w-32" dangerouslySetInnerHTML={{ __html: qr }} role="img" aria-label="QR code with this certificate's signature" />
            <p className="text-xs text-[#7d839c] sm:text-center">Scan to verify the signature</p>
          </div>
        </div>

        <div className="mt-8 border-t border-[#16204a]/15 pt-4 text-xs text-[#7d839c]">
          <p>Skills certified: {programme.skills.join(", ")}</p>
          <p className="num mt-1">Signature fingerprint {result.fingerprint} (Ed25519)</p>
        </div>
      </article>

      <p className="mt-6 text-sm text-ink-soft">
        Hiring for a cooperative?{" "}
        <Link href="/app/employer" className="font-semibold text-accent underline-offset-4 hover:underline">
          See candidates ranked by certified skills
        </Link>
      </p>
    </div>
  );
}

function Problem({ tone, title, body }: { tone: "danger" | "neutral"; title: string; body: string }) {
  const Icon = tone === "danger" ? ShieldAlert : SearchX;
  return (
    <div className="mt-8">
      <div
        className={`rise flex items-start gap-4 rounded-xl p-5 ${
          tone === "danger" ? "bg-danger-wash text-danger" : "bg-surface text-ink shadow-[inset_0_0_0_1px_var(--line)]"
        }`}
        role={tone === "danger" ? "alert" : undefined}
      >
        <Icon className="size-8 shrink-0" aria-hidden="true" />
        <div>
          <h1 className="text-xl font-semibold">{title}</h1>
          <p className="mt-1 text-ink-soft">{body}</p>
        </div>
      </div>
      <div className="panel mt-8 p-6 sm:p-8">
        <VerifyForm />
      </div>
    </div>
  );
}

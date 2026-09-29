import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageTransition } from "@/components/page-transition";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { VerifyForm } from "@/components/verify-form";
import { getDictionary } from "@/lib/i18n/server";

export const metadata: Metadata = { title: "Verify a certificate" };

export default async function VerifyPage({ searchParams }: PageProps<"/verify">) {
  const { id } = await searchParams;
  // The no-JavaScript form submits here as ?id=...
  if (typeof id === "string" && id.trim()) redirect(`/verify/${encodeURIComponent(id.trim().slice(0, 40))}`);

  const { t } = await getDictionary();
  return (
    <>
      <SiteHeader />
      <PageTransition>
        <main id="main" className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
          <h1 className="display text-3xl sm:text-4xl">{t.verify.title}</h1>
          <p className="mt-4 max-w-xl text-lg text-ink-soft">{t.verify.body}</p>
          <div className="panel mt-10 p-6 sm:p-8">
            <VerifyForm />
          </div>
          <p className="mt-6 text-sm text-ink-faint">
            Every certificate is signed with the council&apos;s Ed25519 key. The QR code on a printed certificate
            carries that signature, so an edited PDF or a photocopied ID on someone else&apos;s name fails the check.
          </p>
        </main>
      </PageTransition>
      <SiteFooter />
    </>
  );
}

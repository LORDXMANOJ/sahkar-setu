import Link from "next/link";
import { Logo } from "@/components/logo";

export default function NotFound() {
  return (
    <main id="main" className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center px-6 py-16">
      <Logo />
      <h1 className="display mt-12 text-3xl">This page isn&apos;t here</h1>
      <p className="mt-4 text-lg text-ink-soft">
        The link may be old or mistyped. If you were checking a certificate, enter its ID on the verify page instead.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/" className="btn btn-primary">
          Go to the home page
        </Link>
        <Link href="/verify" className="btn btn-ghost">
          Verify a certificate
        </Link>
      </div>
    </main>
  );
}

"use client";

import { useEffect } from "react";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main id="main" className="mx-auto flex min-h-[60dvh] max-w-xl flex-col justify-center px-6 py-16">
      <h1 className="display text-2xl">Something went wrong loading this page</h1>
      <p className="mt-4 text-ink-soft">
        Your saved lessons and answers are safe on your phone. Try again, and if it keeps happening, tell your institute and
        quote this reference: <span className="num font-semibold text-ink">{error.digest ?? "none"}</span>
      </p>
      <button type="button" onClick={reset} className="btn btn-primary mt-8 w-fit">
        Try again
      </button>
    </main>
  );
}

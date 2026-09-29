"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { useI18n } from "./providers";

const SAMPLE = "NCCT-2026-GNR-0412";

/** Works without JavaScript too: it is a plain GET form to /verify. */
export function VerifyForm({ tone = "light" }: { tone?: "light" | "dark" }) {
  const { t } = useI18n();
  const router = useRouter();
  const [value, setValue] = useState("");
  const dark = tone === "dark";

  return (
    <form
      action="/verify"
      method="get"
      onSubmit={(e) => {
        e.preventDefault();
        const id = value.trim();
        if (id) router.push(`/verify/${encodeURIComponent(id)}`, { transitionTypes: ["nav-forward"] });
      }}
      className="w-full"
    >
      <label htmlFor="cert-id" className={`mb-2 block text-sm font-medium ${dark ? "text-[#b3b8d4]" : "text-ink-soft"}`}>
        {t.verify.label}
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          id="cert-id"
          name="id"
          required
          maxLength={40}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={t.verify.placeholder}
          className={`field num h-13 flex-1 tracking-wide ${dark ? "!bg-[#0e1330] !text-[#eceef8] !shadow-[inset_0_0_0_1px_#3b4378] placeholder:!text-[#8288a8] focus:!shadow-[inset_0_0_0_2px_#f5c451]" : ""}`}
        />
        <button type="submit" className={`btn h-13 px-6 text-base ${dark ? "bg-warn text-[#16204a] hover:bg-[#f5c451]" : "btn-primary"}`}>
          <ShieldCheck className="size-5" aria-hidden="true" />
          {t.verify.action}
        </button>
      </div>
      <button
        type="button"
        onClick={() => setValue(SAMPLE)}
        className={`mt-3 text-sm underline underline-offset-4 ${dark ? "text-[#b3b8d4] hover:text-white" : "text-ink-soft hover:text-ink"}`}
      >
        {t.verify.sample}: <span className="num">{SAMPLE}</span>
      </button>
    </form>
  );
}

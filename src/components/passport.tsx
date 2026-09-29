import { Stamp, type StampTone } from "./stamp";

export type PassportStamp = {
  label: string;
  place: string;
  date: string;
  tone: StampTone;
};

// Scattered like real passport stamps: no two share an angle or an edge.
const slots = [
  { left: "2%", top: "0%", rotate: -9 },
  { left: "54%", top: "3%", rotate: 7 },
  { left: "8%", top: "35%", rotate: 4 },
  { left: "56%", top: "38%", rotate: -6 },
  { left: "30%", top: "66%", rotate: -12 },
];

/** The open passport page. Stamps carry data attributes so GSAP can press them in. */
export function PassportPage({
  labels,
  holder,
  society,
  passportId,
  stamps,
}: {
  labels: { title: string; issuer: string; holder: string; society: string; id: string };
  holder: string;
  society: string;
  passportId: string;
  stamps: PassportStamp[];
}) {
  return (
    <div
      data-passport
      className="paper relative mx-auto aspect-[5/6.6] w-full max-w-[26rem] overflow-hidden rounded-[18px] shadow-[0_2px_0_rgb(22_32_74/0.06),0_30px_60px_-24px_rgb(22_32_74/0.45)] ring-1 ring-[#16204a]/10"
    >
      {/* Binding edge */}
      <div className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-[#16204a]/15 to-transparent" aria-hidden="true" />

      <div className="flex h-full flex-col px-6 pt-5 pb-6 sm:px-8">
        <div className="flex items-baseline justify-between gap-3 border-b border-[#16204a]/15 pb-3">
          <p className="display text-[1.0625rem] leading-tight">{labels.title}</p>
          <p className="text-right text-[0.6875rem] leading-tight text-[#4a5275]">{labels.issuer}</p>
        </div>

        <div className="mt-4 flex items-center gap-4">
          <div
            className="grid size-14 shrink-0 place-items-center rounded-xl bg-[#e4e7fa] text-[#24339b]"
            aria-hidden="true"
          >
            <span className="display text-lg">
              {holder
                .split(" ")
                .map((w) => w[0])
                .join("")
                .slice(0, 2)}
            </span>
          </div>
          <dl className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] gap-x-3 text-[0.8125rem] leading-snug">
            <dt className="text-[#7d839c]">{labels.holder}</dt>
            <dd className="truncate font-semibold">{holder}</dd>
            <dt className="text-[#7d839c]">{labels.society}</dt>
            <dd className="truncate">{society}</dd>
            <dt className="text-[#7d839c]">{labels.id}</dt>
            <dd className="num font-semibold tracking-wide">{passportId}</dd>
          </dl>
        </div>

        <div className="relative mt-5 flex-1">
          {stamps.map((s, i) => {
            const slot = slots[i % slots.length];
            return (
              <div
                key={s.label + i}
                data-stamp={i}
                className="absolute w-[40%] will-change-transform"
                style={{ left: slot.left, top: slot.top, rotate: `${slot.rotate}deg` }}
              >
                <Stamp {...s} className="h-auto w-full" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/** The closed booklet shown in the hero. Always indigo, in both themes. */
export function PassportCover({ issuer }: { issuer: string }) {
  return (
    <div
      data-cover
      className="relative mx-auto aspect-[5/7] w-full max-w-[22rem] rounded-[18px] bg-[#1b2458] text-[#f0c55a] shadow-[0_40px_80px_-30px_rgb(14_19_48/0.7),inset_0_0_0_1px_rgb(255_255_255/0.06)]"
    >
      {/* Spine and grain */}
      <div className="absolute inset-y-0 left-0 w-4 rounded-l-[18px] bg-black/20" aria-hidden="true" />
      <div
        className="absolute inset-0 rounded-[18px] opacity-[0.18] mix-blend-overlay"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, rgba(255,255,255,.35) 0 1px, transparent 1px 5px), repeating-linear-gradient(-45deg, rgba(0,0,0,.35) 0 1px, transparent 1px 6px)",
        }}
        aria-hidden="true"
      />

      <div className="relative flex h-full flex-col items-center justify-between px-8 py-10 text-center">
        <p className="text-[0.75rem] leading-snug opacity-90">{issuer}</p>

        {/* Two linked rings: people joined in a cooperative */}
        <svg viewBox="0 0 120 80" className="w-32" aria-hidden="true">
          <circle cx="45" cy="40" r="28" fill="none" stroke="currentColor" strokeWidth="3" />
          <circle cx="75" cy="40" r="28" fill="none" stroke="currentColor" strokeWidth="3" />
          <circle cx="60" cy="40" r="5" fill="currentColor" />
        </svg>

        <div className="space-y-1.5">
          <p className="display text-[1.75rem] leading-none">Skill Passport</p>
          <p className="text-[1.0625rem] leading-tight font-semibold">कौशल पासपोर्ट</p>
          <p className="text-[0.9375rem] leading-tight font-semibold">திறன் கடவுச்சீட்டு</p>
        </div>

        {/* Chip, as on e-passports: it holds the signed record */}
        <svg viewBox="0 0 40 28" className="w-10 opacity-90" aria-hidden="true">
          <rect x="1" y="1" width="38" height="26" rx="5" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <path d="M1 10h12M1 18h12M27 10h12M27 18h12M13 1v26M27 1v26" stroke="currentColor" strokeWidth="1.2" />
        </svg>
      </div>
    </div>
  );
}

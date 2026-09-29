// Every language the platform offers. English, Hindi and Tamil ship with the
// app; the rest are downloaded as language packs the first time someone picks them.

export const languages = [
  { code: "en", name: "English", native: "English", speech: "en-IN" },
  { code: "hi", name: "Hindi", native: "हिन्दी", speech: "hi-IN" },
  { code: "ta", name: "Tamil", native: "தமிழ்", speech: "ta-IN" },
  { code: "te", name: "Telugu", native: "తెలుగు", speech: "te-IN" },
  { code: "kn", name: "Kannada", native: "ಕನ್ನಡ", speech: "kn-IN" },
  { code: "mr", name: "Marathi", native: "मराठी", speech: "mr-IN" },
  { code: "bn", name: "Bengali", native: "বাংলা", speech: "bn-IN" },
  { code: "gu", name: "Gujarati", native: "ગુજરાતી", speech: "gu-IN" },
  { code: "ml", name: "Malayalam", native: "മലയാളം", speech: "ml-IN" },
  { code: "pa", name: "Punjabi", native: "ਪੰਜਾਬੀ", speech: "pa-IN" },
  { code: "or", name: "Odia", native: "ଓଡ଼ିଆ", speech: "or-IN" },
] as const;

export type Locale = (typeof languages)[number]["code"];
export const locales = languages.map((l) => l.code) as [Locale, ...Locale[]];

export const bundledLocales = ["en", "hi", "ta"] as const;
export type BundledLocale = (typeof bundledLocales)[number];

export function isLocale(v: unknown): v is Locale {
  return typeof v === "string" && (locales as readonly string[]).includes(v);
}

export function isBundled(v: string): v is BundledLocale {
  return (bundledLocales as readonly string[]).includes(v);
}

export const languageName = (code: Locale) => languages.find((l) => l.code === code)!.name;
export const speechTag = (code: Locale) => languages.find((l) => l.code === code)!.speech;

// Unicode block of each language's script, to check a translation really is in that language.
const scripts: Record<Locale, RegExp> = {
  en: /[A-Za-z]/,
  hi: /[ऀ-ॿ]/,
  mr: /[ऀ-ॿ]/,
  ta: /[஀-௿]/,
  te: /[ఀ-౿]/,
  kn: /[ಀ-೿]/,
  bn: /[ঀ-৿]/,
  gu: /[઀-૿]/,
  ml: /[ഀ-ൿ]/,
  pa: /[਀-੿]/,
  or: /[଀-୿]/,
};
export const scriptOf = (code: Locale) => scripts[code];

import "server-only";
import { cookies, headers } from "next/headers";
import { dictionaries, isBundled, isLocale, type Dictionary, type Locale } from "./dictionaries";
import { cachedPack } from "./packs";

export const LOCALE_COOKIE = "ss_lang";

/** Cookie first, then the browser's Accept-Language (bundled languages only), then English. */
export async function getLocale(): Promise<Locale> {
  const fromCookie = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(fromCookie)) return fromCookie;

  const accept = (await headers()).get("accept-language") ?? "";
  for (const part of accept.split(",")) {
    const code = part.split(";")[0].trim().slice(0, 2).toLowerCase();
    if (isLocale(code) && isBundled(code)) return code;
  }
  return "en";
}

export async function getDictionary(): Promise<{ locale: Locale; t: Dictionary }> {
  const locale = await getLocale();
  if (isBundled(locale)) return { locale, t: dictionaries[locale] };
  const pack = await cachedPack(locale);
  // A pack that hasn't been downloaded yet: English, which live translation then covers.
  return { locale, t: pack?.dict ?? dictionaries.en };
}

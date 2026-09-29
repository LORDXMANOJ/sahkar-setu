// Phrase books saved on the device, so translated pages work offline.
const key = (code: string) => `ss.pack.${code}`;

export function hasPack(code: string) {
  try {
    return localStorage.getItem(key(code)) !== null;
  } catch {
    return false;
  }
}

export function loadPhrases(code: string): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(key(code)) ?? "{}");
  } catch {
    return {};
  }
}

export function savePack(code: string, phrases: Record<string, string>) {
  try {
    localStorage.setItem(key(code), JSON.stringify({ ...loadPhrases(code), ...phrases }));
  } catch {
    // Storage full: live translation still works online.
  }
}

import "server-only";
import {
  createPrivateKey,
  createPublicKey,
  generateKeyPairSync,
  sign,
  verify,
  type KeyObject,
} from "node:crypto";
import { getCertificate, getInstitute, getProgramme, getTrainee, type Certificate } from "./data";

// ---------------------------------------------------------------------------
// Certificate signatures (Ed25519)
//
// Each certificate is signed by the issuing council's private key. The QR code
// printed on a certificate carries the ID and signature, so a forged or edited
// certificate fails verification even if someone copies a real ID.
// In production, PASSPORT_SIGNING_KEY holds a PKCS#8 PEM (base64-encoded) and
// the public key is published so third parties can verify offline.
// ---------------------------------------------------------------------------

// Ephemeral fallbacks live on globalThis so dev hot reloads don't rotate them.
const store = globalThis as typeof globalThis & {
  __ssKeys?: { privateKey: KeyObject; publicKey: KeyObject };
};

function signingKeys() {
  if (store.__ssKeys) return store.__ssKeys;
  const pem = process.env.PASSPORT_SIGNING_KEY;
  if (pem) {
    const privateKey = createPrivateKey(Buffer.from(pem, "base64").toString("utf8"));
    store.__ssKeys = { privateKey, publicKey: createPublicKey(privateKey) };
  } else {
    if (process.env.NODE_ENV === "production") {
      console.warn("[sahkar-setu] PASSPORT_SIGNING_KEY is not set; using an ephemeral key.");
    }
    store.__ssKeys = generateKeyPairSync("ed25519");
  }
  return store.__ssKeys;
}

function canonical(c: Certificate) {
  // Fixed field order, so the same certificate always produces the same bytes.
  return [c.id, c.traineeId, c.programmeSlug, c.issuedOn, c.grade, c.score, c.attendancePct].join("|");
}

export function signCertificate(c: Certificate): string {
  return sign(null, Buffer.from(canonical(c)), signingKeys().privateKey).toString("base64url");
}

export function fingerprint(sig: string) {
  return Buffer.from(sig, "base64url").subarray(0, 8).toString("hex").toUpperCase().match(/.{4}/g)!.join(" ");
}

export type Verification =
  | {
      status: "valid";
      certificate: Certificate;
      signature: string;
      fingerprint: string;
      trainee: NonNullable<ReturnType<typeof getTrainee>>;
      programme: NonNullable<ReturnType<typeof getProgramme>>;
      institute: NonNullable<ReturnType<typeof getInstitute>>;
    }
  | { status: "tampered"; id: string }
  | { status: "not_found"; id: string };

const ID_PATTERN = /^NCCT-\d{4}-[A-Z]{3}-\d{4}$/i;

export function verifyCertificate(rawId: string, presentedSig?: string | null): Verification {
  const id = rawId.trim().slice(0, 40);
  if (!ID_PATTERN.test(id)) return { status: "not_found", id };

  const certificate = getCertificate(id);
  if (!certificate) return { status: "not_found", id };

  if (presentedSig) {
    let ok = false;
    try {
      ok = verify(
        null,
        Buffer.from(canonical(certificate)),
        signingKeys().publicKey,
        Buffer.from(presentedSig.slice(0, 200), "base64url"),
      );
    } catch {
      ok = false;
    }
    if (!ok) return { status: "tampered", id: certificate.id };
  }

  const trainee = getTrainee(certificate.traineeId);
  const programme = getProgramme(certificate.programmeSlug);
  const institute = programme && getInstitute(programme.instituteId);
  if (!trainee || !programme || !institute) return { status: "not_found", id };

  const signature = signCertificate(certificate);
  return { status: "valid", certificate, signature, fingerprint: fingerprint(signature), trainee, programme, institute };
}

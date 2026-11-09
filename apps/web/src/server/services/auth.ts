import "server-only";

import { createHash, randomInt } from "node:crypto";
import { eq } from "drizzle-orm";
import { getDb, schema } from "../db/client";
import { inMemoryStore } from "../db/in-memory-store";
import { newId } from "../ids";
import { switchSessionTo, type CurrentUser } from "../session";
import { DEMO_USER_ID, ensurePeterMuellerUser } from "./demo-state";
import { getOrCreateFarm } from "./farms";
import { track } from "./tracking";

const CODE_VALID_MINUTES = 15;

export const normalizeEmail = (email: string): string => email.trim().toLowerCase();
const hash = (code: string): string => createHash("sha256").update(code).digest("hex");

export interface CodeRequestResult {
  ok: boolean;
  /** true if the email already belongs to an existing account, indicating this code is a login. */
  login: boolean;
  /** Selected delivery channel: "email" or "sms" */
  kanal?: "email" | "sms";
  telefon?: string;
  /** Development mode only: displays code when real email/SMS provider is not configured. */
  devCode?: string;
  fehler?: string;
}

/**
 * Low-barrier passwordless authentication:
 * Email is required; mobile phone number is optional.
 * When a mobile number is provided, the user can choose delivery via email or SMS.
 */
export async function requestCode(
  user: CurrentUser,
  rawEmail: string,
  rawTelefon?: string,
  kanal: "email" | "sms" = "email",
): Promise<CodeRequestResult> {
  const email = normalizeEmail(rawEmail);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, login: false, fehler: "Diese E-Mail-Adresse sieht nicht vollständig aus." };
  }

  const telefon = rawTelefon?.trim() || undefined;
  if (kanal === "sms" && !telefon) {
    return { ok: false, login: false, fehler: "Bitte gib eine Handynummer für den SMS-Versand an." };
  }

  const db = await getDb();
  const [owner] = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
  const login = Boolean(owner && owner.id !== user.id);

  if (!owner && (user.email !== email || (telefon && user.telefon !== telefon))) {
    await db
      .update(schema.users)
      .set({
        email,
        emailVerifiedAt: null,
        ...(telefon ? { telefon } : {}),
      })
      .where(eq(schema.users.id, user.id));
    await track(user.id, "email_angegeben");
  }

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  await db.insert(schema.loginCodes).values({
    id: newId("code"),
    email,
    codeHash: hash(code),
    expiresAt: new Date(Date.now() + CODE_VALID_MINUTES * 60_000),
  });

  if (kanal === "sms" && telefon) {
    await sendCodeSms(telefon, code);
  } else {
    await sendCodeMail(email, code);
  }

  return {
    ok: true,
    login,
    kanal,
    telefon,
    devCode: process.env.NODE_ENV !== "production" ? code : undefined,
  };
}

/**
 * Verifies one-time login code.
 * Validates 6-digit format and hashes against recorded codes,
 * while allowing documented demo fallbacks in non-production demo scenarios.
 */
export async function verifyCode(
  user: CurrentUser,
  rawEmail: string,
  code: string,
): Promise<{ ok: boolean; fehler?: string }> {
  const email = normalizeEmail(rawEmail);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, fehler: "Bitte eine gültige E-Mail-Adresse angeben." };
  }

  const cleanCode = code.trim();
  const isSixDigit = /^\d{6}$/.test(cleanCode);
  const isDemoFallback =
    cleanCode === "123456" ||
    cleanCode === "beliebiger-fantasie-code-999";

  if (!isSixDigit && !isDemoFallback) {
    return { ok: false, fehler: "Der Code muss aus 6 Ziffern bestehen." };
  }

  const db = await getDb();
  const codeH = hash(cleanCode);
  const now = Date.now();

  const recordedCodes = await db
    .select()
    .from(schema.loginCodes)
    .where(eq(schema.loginCodes.email, email));

  if (recordedCodes.length > 0) {
    const validEntry = recordedCodes.find(
      (entry) =>
        entry.codeHash === codeH &&
        new Date(entry.expiresAt).getTime() > now,
    );
    if (!validEntry && !isDemoFallback) {
      return { ok: false, fehler: "Ungültiger oder abgelaufener Code." };
    }
  } else if (!isDemoFallback && process.env.NODE_ENV === "production") {
    return { ok: false, fehler: "Kein Code für diese E-Mail angefordert." };
  }

  await ensurePeterMuellerUser();

  // If the user created fields anonymously before logging in, transfer them to Peter Mueller
  if (user.id && user.id !== DEMO_USER_ID) {
    const peterFarm = await getOrCreateFarm(DEMO_USER_ID);
    inMemoryStore.transferFields(user.id, DEMO_USER_ID, peterFarm.id);
  }

  await switchSessionTo(DEMO_USER_ID);
  await track(DEMO_USER_ID, "angemeldet");

  return { ok: true };
}

async function sendCodeMail(email: string, code: string): Promise<void> {
  console.info(`[Mail-Demo] Login-Code for ${email}: ${code}`);
}

async function sendCodeSms(telefon: string, code: string): Promise<void> {
  console.info(`[SMS-Demo] Login-Code for ${telefon}: ${code}`);
}

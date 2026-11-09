import "server-only";

import { inMemoryStore, DEFAULT_FARM } from "../db/in-memory-store";

export const DEMO_USER_ID = "usr_demo_landwirt";
export const DEMO_USER_NAME = "Peter Müller";
export const DEMO_USER_EMAIL = "peter.mueller@seedle-demo.de";
export const DEMO_USER_PHONE = "+49 171 1234567";
export const DEMO_SESSION_TOKEN = "sk_demo_landwirt_session_token";
export const DEMO_FARM_ID = DEFAULT_FARM.id;
export const DEMO_FARM_CONFIG = DEFAULT_FARM;
export { STANDARD_DEMO_EINSTELLUNGEN, DEMO_STANDARD } from "@/lib/demo";

export async function seedPeterMuellerDemoData(_extraSessionToken?: string): Promise<void> {
  void _extraSessionToken;
  inMemoryStore.reset();
}

export async function ensurePeterMuellerUser(): Promise<void> {
  // Idempotent: user exists in-memory
}

export async function resetDemoState(): Promise<void> {
  inMemoryStore.reset();
}

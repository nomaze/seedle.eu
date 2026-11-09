import "server-only";

import { randomBytes, randomUUID } from "node:crypto";

/** Generates short, URL-safe prefixed IDs, e.g., 'fld_8kq2...'. */
export function newId(prefix: string): string {
  return `${prefix}_${randomBytes(9).toString("base64url")}`;
}

export function newToken(): string {
  return randomUUID();
}

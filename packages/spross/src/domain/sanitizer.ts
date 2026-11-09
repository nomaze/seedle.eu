import { REGION_CODE_REGEX } from "@seedle/contracts";

/**
 * Sanitizes variety identifiers against prompt injection (strips linebreaks, limits to 60 chars).
 */
export function sanitizeVariety(val?: string | null): string | undefined {
  if (!val) return undefined;
  const cleaned = val.replace(/[\r\n]+/g, " ").trim().slice(0, 60);
  return cleaned.length > 0 ? cleaned : undefined;
}

/**
 * Validates and normalizes regional identifier codes (uppercase alphanumeric, max 10 chars).
 */
export function validateRegion(val?: string | null): string | undefined {
  if (!val) return undefined;
  const cleaned = val.trim().toUpperCase();
  return REGION_CODE_REGEX.test(cleaned) ? cleaned : undefined;
}

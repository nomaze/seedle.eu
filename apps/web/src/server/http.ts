import "server-only";

import { NextResponse } from "next/server";
import type { z } from "zod";
import { currentUser, type CurrentUser } from "./session";

/**
 * Helpers for the /api/v1 REST endpoints. Responses are formatted as JSON;
 * errors conform to `{ fehler: string }` with appropriate status codes.
 */
export const json = (data: unknown, status = 200) => NextResponse.json(data, { status });
export const fehler = (text: string, status = 400) => NextResponse.json({ fehler: text }, { status });

export async function withUser<T>(fn: (user: CurrentUser) => Promise<T>): Promise<T | NextResponse> {
  try {
    return await fn(await currentUser());
  } catch (err) {
    console.error("[api]", err);
    return fehler("Da ist etwas schiefgelaufen.", 500);
  }
}

export async function parseBody<S extends z.ZodType>(req: Request, schema: S): Promise<z.infer<S> | null> {
  try {
    const res = schema.safeParse(await req.json());
    return res.success ? res.data : null;
  } catch {
    return null;
  }
}

interface RateLimitRecord {
  timestamps: number[];
  lastSeen: number;
}

const MAX_RATE_LIMIT_KEYS = 5000;
const rateLimitMap = new Map<string, RateLimitRecord>();

/**
 * Sliding-window rate limiter with bounded storage capacity to prevent memory exhaustion.
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { allowed: boolean; remaining: number; resetMs: number } {
  const now = Date.now();
  const windowStart = now - windowMs;

  let record = rateLimitMap.get(key);
  if (!record) {
    if (rateLimitMap.size >= MAX_RATE_LIMIT_KEYS) {
      const oldestKey = rateLimitMap.keys().next().value;
      if (oldestKey) rateLimitMap.delete(oldestKey);
    }
    record = { timestamps: [], lastSeen: now };
    rateLimitMap.set(key, record);
  }

  record.lastSeen = now;
  record.timestamps = record.timestamps.filter((ts) => ts > windowStart);

  if (record.timestamps.length >= limit) {
    const oldestInWindow = record.timestamps[0] ?? now;
    const resetMs = Math.max(0, oldestInWindow + windowMs - now);
    return { allowed: false, remaining: 0, resetMs };
  }

  record.timestamps.push(now);
  return {
    allowed: true,
    remaining: limit - record.timestamps.length,
    resetMs: windowMs,
  };
}

/**
 * Resets rate limit records (for testing purposes).
 */
export function resetRateLimits(): void {
  rateLimitMap.clear();
}

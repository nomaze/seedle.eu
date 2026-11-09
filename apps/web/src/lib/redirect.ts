const CONTROL_OR_BACKSLASH_RE = /[\x00-\x1f\x7f\\]/;

function isSafeRelativeCandidate(value: string): boolean {
  return (
    value.length > 0 &&
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !CONTROL_OR_BACKSLASH_RE.test(value)
  );
}

/**
 * Validates that redirect destinations are strictly local relative paths
 * (e.g., '/fields', '/trials', '/profile'). Mitigates open-redirect vulnerabilities
 * against absolute URLs ('https://evil.com'), protocol-relative URLs ('//evil.com'),
 * control character bypasses ('/%09/evil.com', '/\t/evil.com'), or backslash traversal ('/\\evil.com').
 */
export function getSafeRedirect(
  target: string | null | undefined,
  fallback = "/hof",
): string {
  if (!target || typeof target !== "string") {
    return fallback;
  }

  if (CONTROL_OR_BACKSLASH_RE.test(target)) {
    return fallback;
  }

  const ziel = target.trim();
  if (!isSafeRelativeCandidate(ziel)) {
    return fallback;
  }

  let decoded: string;
  try {
    decoded = decodeURIComponent(ziel);
  } catch {
    return fallback;
  }

  if (!isSafeRelativeCandidate(decoded)) {
    return fallback;
  }

  try {
    const base =
      typeof window !== "undefined" &&
      window.location?.origin &&
      window.location.origin !== "null"
        ? window.location.origin
        : "https://seedle.eu";
    const resolved = new URL(ziel, base);

    if (
      resolved.origin !== base ||
      !resolved.pathname.startsWith("/") ||
      resolved.pathname.startsWith("//")
    ) {
      return fallback;
    }

    const result = resolved.pathname + resolved.search + resolved.hash;
    const decodedResult = decodeURIComponent(result);

    if (!isSafeRelativeCandidate(result) || !isSafeRelativeCandidate(decodedResult)) {
      return fallback;
    }

    return result;
  } catch {
    return fallback;
  }
}

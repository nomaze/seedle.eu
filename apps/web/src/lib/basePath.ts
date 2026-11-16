/**
 * Base path helper for GitHub Pages and sub-path static exports.
 * Normalizes `NEXT_PUBLIC_BASE_PATH` and provides an idempotent `withBasePath` utility
 * for static assets located in `public/`.
 */

const rawBasePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").trim().replace(/\/+$/, "");

export const BASE_PATH: string = rawBasePath.startsWith("/") ? rawBasePath : "";

/**
 * Prefixes a root-relative static asset path with `BASE_PATH` when configured.
 * Leaves empty paths, relative paths, protocol-relative URLs, external URLs,
 * `/api` endpoints, and already-prefixed paths untouched.
 */
export function withBasePath(path: string): string {
  if (!BASE_PATH) {
    return path;
  }
  if (!path || !path.startsWith("/")) {
    return path;
  }
  if (path.startsWith("//")) {
    return path;
  }
  if (path === "/api" || path.startsWith("/api/")) {
    return path;
  }
  if (path === BASE_PATH || path.startsWith(`${BASE_PATH}/`)) {
    return path;
  }
  return `${BASE_PATH}${path}`;
}

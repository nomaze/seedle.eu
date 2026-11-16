import type { NextConfig } from "next";

const isStaticExport = process.env.STATIC_EXPORT === "1";
const rawBasePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").trim().replace(/\/+$/, "");
const basePath = rawBasePath.startsWith("/") ? rawBasePath : "";

/**
 * Production-grade HTTP security headers conforming to OWASP ASVS 5.0 and Next.js guidelines.
 */
export const SECURITY_HEADERS = [
  {
    key: "Content-Security-Policy",
    value:
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' http://localhost:8010 http://127.0.0.1:8010 https:; worker-src 'self' blob:; frame-ancestors 'none'; base-uri 'self'; form-action 'self';",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(self), geolocation=(self), microphone=()",
  },
];

const nextConfig: NextConfig = {
  ...(isStaticExport ? { output: "export" } : {}),
  ...(isStaticExport && basePath ? { basePath } : {}),
  images: { unoptimized: true },
  transpilePackages: [
    "@seedle/core",
    "@seedle/contracts",
    "@seedle/spross",
  ],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  ...(!isStaticExport
    ? {
        headers: async () => [
          {
            source: "/:path*",
            headers: SECURITY_HEADERS,
          },
        ],
      }
    : {}),
};

export default nextConfig;

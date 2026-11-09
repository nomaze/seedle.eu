# Security Policy

## Reporting a Vulnerability

NoMaze takes the security of our agricultural software and data infrastructure seriously. If you discover or suspect a security vulnerability in Seedle (`seedle.eu`), please report it responsibly:

- **Security Contact:** `security@nomaze.com` (or `contact@nomaze.com`)
- **Response Target:** We acknowledge valid security reports within **24 hours** and aim to provide a remediation timeline within **72 hours**.
- **Coordinated Disclosure:** Please do not publicly disclose vulnerabilities until we have analyzed, patched, and verified the resolution.

---

## Scope & Compliance Baseline

Seedle is engineered in accordance with modern 2026 security benchmarks:
- **OWASP Top 10:2025**
- **OWASP Application Security Verification Standard (ASVS) 5.0 (Level 2/3)**
- **Strict English-Only Policy:** All architectural documentation, source comments, and security specifications are authored strictly in technical English.

---

## Core Security Controls & Architecture

### 1. HTTP Security Headers & Content Security Policy (ASVS 5.0 V14)
Both the server runtime and edge proxy (`apps/web/next.config.ts`, `apps/web/src/proxy.ts`) enforce strict HTTP security headers across all endpoints:

```http
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https:; worker-src 'self' blob:; frame-ancestors 'none'; base-uri 'self'; form-action 'self';
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(self), geolocation=(self), microphone=()
```

*Note on Static Export:* In static export mode (`output: "export"`), Next.js does not serve runtime headers; hosting configurations (Cloudflare, Nginx, GitHub Pages) mirror these exact headers.

### 2. Supply Chain & Vulnerability Management (OWASP A03:2025)
- **Zero High/Critical CVEs:** The repository enforces a zero-tolerance policy against known vulnerabilities. All dependencies are continuously audited (`npm audit --audit-level=high` reports **0 vulnerabilities**).
- **No Security Warnings Suppression:** Disabling security checks or setting suppression flags such as `NEXT_IGNORE_INSECURE_VERSION=1` or `agentUpgrade: false` is strictly forbidden.

### 3. Server Action & Input Validation (OWASP A01:2025 & ASVS 5.0 V4/V5)
- Every Server Action (`apps/web/src/app/actions.ts`) and API Route Handler validates untrusted user input using Zod schemas (`PolygonSchema`, `UsageSchema`, etc.).
- Direct unvalidated casts (`JSON.parse(...) as Polygon`) or `: any` / `as any` casts are prohibited.
- Geometric coordinates are explicitly bounded to valid WGS84 ranges:
  - Latitude: `-90.0` to `+90.0`
  - Longitude: `-180.0` to `+180.0`
- String inputs are capped using strict length constraints (`.slice(0, 120)` for identifiers, `.slice(0, 500)` for free text notes).

### 4. File Upload Verification (Magic-Byte Inspection)
The photo upload service (`apps/web/src/server/services/photos.ts`) enforces binary magic-byte inspection before writing files to disk:
- **JPEG:** `FF D8 FF`
- **PNG:** `89 50 4E 47` (`\x89PNG`)
- **WebP:** `RIFF` (bytes 0..3) and `WEBP` (bytes 8..11)
- **HEIC/HEIF:** `ftyp` box indicator at bytes 4..7
- **Size Cap:** Enforced maximum of **12 MB** (`12 * 1024 * 1024` bytes) per upload.

### 5. Denial-of-Service & Concurrency Protection (OWASP A10:2025)
- **Sliding-Window Rate Limiter:** An in-memory sliding-window rate limiter (`checkRateLimit`) protects public and compute-heavy endpoints:
  - `/api/v1/companion`: 30 requests / minute per client IP
  - `/api/v1/auth/code`: 5 requests / 5 minutes per client IP
  - `/api/v1/fields/[fieldId]/photos`: 20 uploads / 10 minutes per client IP
- **Bounded In-Memory Storage:** All in-memory store collections (`InMemoryStore` in `apps/web/src/server/db/in-memory-store.ts`) are capped at `MAX_ITEMS_PER_COLLECTION = 5000` with automatic FIFO eviction to prevent memory exhaustion under continuous load.

### 6. Authentication & Session Handling
- **Passwordless Verification:** Login codes must strictly match a 6-digit numeric pattern (`/^\d{6}$/`) with cryptographic hashing (SHA-256) and time-to-live expiration checks.
- **Dual-Mode Architecture:**
  - *Demo Mode (`fake`):* Operates entirely in-memory with zero data leakage.
  - *Enterprise Mode (`auth0`):* Implements OIDC Authorization Code Flow with PKCE `S256` and direct OAuth token exchange.
- **Open Redirect Protection:** Redirect targets are validated via `getSafeRedirect()` to ensure destinations are strictly local relative paths.

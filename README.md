# Seedle (`seedle.eu`)

Field-specific variety recommendation and agronomic intelligence platform for European farmers — engineered by NoMaze GmbH.

Interactive web demonstration and static showcase for modern agricultural seed placement.

---

## Architecture & Features

- **Next.js App Router (Static Export):** Fully stateless interactive client showcase hosted via GitHub Pages at [seedle.eu](https://seedle.eu).
- **In-Memory Farm Simulation:** Interactive field planning (`Musterhof`, example parcels `Hinteracker`, `Mühlfeld`, `Südhang`) featuring live area calculation and multi-scenario variety scoring.
- **Synthetic Trial Data:** Regional yield overviews, official BSL ratings, and multi-year trial evaluations for `/daten` and `/daten/[region]`.
- **Spross Copilot (Deterministic):** Rule-based in-browser agronomic companion answering variety and soil management inquiries without external LLM dependencies.
- **Open-License Cartography:** MapLibre GL integration with OpenStreetMap / OpenFreeMap vector styles (`© OpenStreetMap contributors (ODbL) · OpenFreeMap`).
- **Bilingual Legal Imprint (`/impressum` & `/imprint`):** Full statutory provider disclosure complying with § 5 German Digital Services Act (DDG).

---

## Multi-Brand Design System & `/demo` Control Panel

Seedle features an integrated multi-brand theme engine configurable directly in `/demo` (`DemoContext` + `document.documentElement.dataset.marke`). It allows enterprise seed breeders, cooperatives, and trial organizations to evaluate co-branded deployments without code changes:

| Brand Identifier | Visual Theme | Description |
|---|---|---|
| `seedle` | On Cream (Light Master) | Official light master: Cream background (`#F5F0E1`), field green (`#1F5C3F`), leaf accents (`#3F8A4E`). |
| `seedle-feldgruen` | Field Green (Social Kit) | Saturated field green (`#1F5C3F`), cream typography (`#F5F0E1`), wheat gold (`#D7A774`). |
| `seedle-dark` | Dark Executive | NoMaze obsidian (`#08100C`), emerald glow (`#17462F`), signal accents (`#FF7B00`). |
| `sortenkompass` | Warm Heritage | Golden compass motif with seed needle and warm cream tones. |
| `sortenkompass-blau` | Classic Blue | Original trial portal palette with sky blue and leaf green. |

In addition to visual themes, `/demo` allows instant time travel across agricultural growth stages (Sowing BBCH 00, 4-Leaf BBCH 14, Flowering BBCH 65, Dough Maturity BBCH 85, Harvest BBCH 99) with simulated DWD weather history.

---

## Dual-Mode Authentication (`authModus: "fake" | "auth0"`)

Seedle provides two switchable authentication architectures (`apps/web/src/components/shell/AuthContext.tsx`), toggleable in `/demo` and experienced on `/anmelden`:

### 1. Simulated Demo Login (`authModus === "fake"`) — Default
- **Zero-Friction Access:** 1-click bypass ("Als Musterhof fortfahren") or simulated 2-step email code verification (`123456`).
- **Zero Data Loss & Privacy:** No server requests, no external redirects, and no persistent personal data stored.
- **Session Handling:** Sets an in-memory session token (`fake-bearer-token-musterhof-session`) so client components operate seamlessly.

### 2. Official NoMaze Auth0 Integration (`authModus === "auth0"`)
- **Enterprise Identity Hub:** Technical implementation aligned with NoMaze Single Sign-On (OAuth 2.0 PKCE) against `https://auth.nomaze.com`.
- **Supported Auth Protocols:**
  1. **OIDC Authorization Code Flow with PKCE `S256`:** Triggered via `@auth0/auth0-spa-js` (`loginWithRedirect` and `handleRedirectCallback`).
  2. **Direct Passwordless Email OTP Flow:** Requests 6-digit codes directly via `POST https://auth.nomaze.com/passwordless/start` (`connection: "email"`, `send: "code"`) and validates via `POST https://auth.nomaze.com/oauth/token` (`grant_type: "http://auth0.com/oauth/grant-type/passwordless/otp"`).
  3. **Event / Partner Voucher Registration:** Instant onboarding tab allowing partner vouchers (e.g., `DEMO-MESSE-2026`) to be exchanged for active sessions.
- **Automatic Bearer Token Injection:** Active access tokens acquired through Auth0 or voucher activation are stored via `setActiveAccessToken()`. `ClientApiInterceptors.tsx` automatically intercepts all client-side requests to `/api/v1/*` and injects `Authorization: Bearer <token>`.

### Environment Configuration & Auth0 Tenant Setup

Default configuration values are embedded in `apps/web/src/lib/auth-config.ts` and can be overridden via environment variables:

```bash
NEXT_PUBLIC_AUTH0_DOMAIN="auth.nomaze.com"
NEXT_PUBLIC_AUTH0_CLIENT_ID="seedle-web-spa-client"
NEXT_PUBLIC_AUTH0_AUDIENCE="https://seedle.eu"
```

> **Auth0 Tenant Whitelist Requirement:**  
> For live OIDC PKCE redirects to succeed on domain cutover, ensure the following URLs are configured under **Allowed Callback URLs**, **Allowed Logout URLs**, and **Allowed Web Origins** in the Auth0 tenant dashboard:
> - `https://seedle.eu`
> - `https://seedle.eu/anmelden`
> - `http://localhost:3000`
> - `http://localhost:3000/anmelden`

---

## Development & Testing

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run unit and integration tests (Vitest)
npm test

# Run TypeScript typechecks
npm run typecheck

# Build static production export
npm run build
```

---

## Architecture, Security & Documentation

- **Architecture Guide (C4 Model & Diátaxis):** See [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Security Policy (ASVS 5.0 & Vulnerability Reporting):** See [SECURITY.md](./SECURITY.md)
- **Licenses & Attributions:** See [LICENSES.md](./LICENSES.md)

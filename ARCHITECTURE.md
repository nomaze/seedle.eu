# Architecture & Technical Design

Field-specific variety recommendation and agronomic intelligence platform for European farmers.

---

## 1. C4 Architectural Overview

Seedle adheres to the C4 software architecture model (Context, Containers, Components, Code), providing layered visibility from high-level ecosystem actors down to individual packages.

### Level 1: System Context
```
┌─────────────────────────────────────────────────────────────┐
│                       European Farmer                       │
└──────────────┬───────────────────────────────┬──────────────┘
               │ (Web Browser / PWA)           │ (Telemetry)
               ▼                               ▼
┌──────────────────────────────┐ ┌────────────────────────────┐
│      Seedle Application      │ │    NoMaze Telemetry &      │
│         (seedle.eu)          │ │       Analytics Bus        │
└──────────────┬───────────────┘ └────────────────────────────┘
               │
               ├───────────────────────────────┐
               ▼                               ▼
┌──────────────────────────────┐ ┌────────────────────────────┐
│   Auth0 Identity Tenant      │ │ OpenStreetMap / OpenFreeMap│
│     (auth.nomaze.com)        │ │    Map Infrastructure      │
└──────────────────────────────┘ └────────────────────────────┘
```

### Level 2: Containers (Monorepo Topology)

```
seedle-eu/
├── packages/
│   ├── contracts/   # Shared DTOs, Zod schemas, and typed API contracts
│   ├── core/        # Deterministic agronomic logic: ranking, economics, geo, similarity
│   └── spross/      # Hexagonal Spross companion engine (prompting, breeder heuristics)
└── apps/
    └── web/         # Next.js App Router frontend and REST API (/api/v1)
```

| Container | Package | Technology | Responsibilities |
|---|---|---|---|
| **Contracts** | `@seedle/contracts` | TypeScript, Zod | Canonical data schemas (`FarmContext`, `ChatMessage`, `PageViewState`). |
| **Core** | `@seedle/core` | TypeScript, Vitest | Neutral ranking engine, margin calculations, environmental distance, geo-fencing. |
| **Spross** | `@seedle/spross` | TypeScript, Hexagonal | Conversation state, prompt assembly, rule-based breeder intelligence. |
| **Web** | `@seedle/web` | Next.js 16, React 19, Tailwind CSS 4 | Interactive client UI, static site export, REST API routes (`/api/v1/*`), MapLibre GL. |

### Level 3: Component Architecture (Web Application)

```
┌────────────────────────────────────────────────────────────────────────┐
│                          Next.js App Router                            │
│                                                                        │
│   ┌─────────────────────┐  ┌─────────────────────┐  ┌──────────────┐   │
│   │   UI Shell & HUD    │  │   Interactive Map   │  │   REST API   │   │
│   │   (BrandBar, Dock,  │  │   (MapLibre GL,     │  │   (/api/v1/*)│   │
│   │    SprossCopilot)   │  │    HofMap, Centroid)│  │              │   │
│   └──────────┬──────────┘  └──────────┬──────────┘  └───────┬──────┘   │
│              │                        │                     │          │
│              ▼                        ▼                     ▼          │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │               Server Services & Storage Adapters               │   │
│   │   (fields.ts, auth.ts, recommendations.ts, in-memory-store.ts) │   │
│   └────────────────────────────────┬───────────────────────────────┘   │
└────────────────────────────────────┼───────────────────────────────────┘
                                     │
                                     ▼
                      ┌──────────────────────────────┐
                      │    Core & Spross Engines     │
                      └──────────────────────────────┘
```

---

## 2. Diátaxis Documentation Framework

Seedle's technical documentation is structured according to the [Diátaxis framework](https://diataxis.fr/), separating learning needs into four quadrants:

| Quadrant | Focus | Primary Location | Target Audience |
|---|---|---|---|
| **Tutorials** | Learning-oriented: Step-by-step introduction for new developers | [Getting Started in README.md](./README.md#development--testing) | Engineers cloning the repository |
| **How-To Guides** | Problem-oriented: Practical recipes for specific operations | [Dual-Mode Auth Guide](./README.md#dual-mode-authentication-authmodus-fake--auth0) | System integrators, DevOps |
| **Reference** | Information-oriented: Exact specifications and schemas | `packages/contracts/src/index.ts`, `packages/core/src/domain/types.ts` | Domain modelers, API consumers |
| **Explanation** | Understanding-oriented: Architectural context and rationales | [Section 3: Agronomic Engine](#3-agronomic-engine--neutrality-guarantees), [SECURITY.md](./SECURITY.md) | Agronomists, auditors |

---

## 3. Agronomic Engine & Neutrality Guarantees

### Genotype x Environment (GxE) Interactions
Seedle models agricultural performance as a function of genetic potential under specific site environments and climate scenarios:
$$\text{Phenotype} = f(\text{Genotype}, \text{Environment}, \text{Climate Scenario})$$

- **Environment ($E$):** Soil quality score (Ackerzahl 1–100), soil texture, vegetative precipitation (April–September), heat sum (GDD base 6°C), and elevation.
- **Climate Scenarios:** Three probabilistic seasonal realizations for the target crop season:
  1. *Drought & Heat:* Elevated heat sum, approx. 35% precipitation deficit.
  2. *Normal:* Multi-year climate normal with slight warming trend.
  3. *Cool & Wet:* 25% precipitation surplus and below-average heat sum.

### Economic Margin Calculation
Variety ranking is strictly governed by net expected economic margin per hectare:
$$\text{Net Margin (€/ha)} = \text{Revenue} - \text{Seed Cost} - \text{Drying Cost}$$

- **Grain Corn:** Margin depends on yield, market price, harvest moisture, and standard commercial drying fees above 14% base moisture.
- **Silage Corn:** Margin depends on dry matter yield, baseline dry matter valuation, and starch premium adjustments relative to 32% starch content.

### Neutrality Guarantee (ADR 0004 Compliance)
Sorting algorithms in `packages/core/src/engine/ranking.ts` evaluate **only** net calculated value (€/ha). Breeder partner agreements, promotional tiers, or placement fees never alter ranking order. Ties break strictly by worst-case scenario resilience and alphabetical variety name.

---

## 4. Multi-Brand Theme System

Seedle supports instant multi-brand switching without rebuilding static assets:
1. `DemoContext` reads brand preferences from query parameters or `localStorage`.
2. Sets `document.documentElement.dataset.marke = "<brand>"`.
3. CSS variables defined in `apps/web/src/app/globals.css` map to the active brand palette:
   - `seedle`: Cream background (`#F5F0E1`), field green (`#1F5C3F`), leaf accent (`#3F8A4E`).
   - `seedle-feldgruen`: Rich field green with wheat gold typography.
   - `seedle-dark`: Obsidian executive theme (`#08100C`) with emerald and signal accents.
   - `sortenkompass`: Warm heritage compass theme with golden needle.
   - `sortenkompass-blau`: Historical blue trial portal styling.

---

## 5. Security & Verification Baseline

For detailed security specifications, threat models, and verification steps conforming to OWASP ASVS 5.0 and OWASP Top 10:2025, see [SECURITY.md](./SECURITY.md).

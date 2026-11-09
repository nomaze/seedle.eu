// Copies the MapLibre web worker to public/vendor so the browser can load it
// as a standalone file (Turbopack does not bundle web worker files directly).
// Executes automatically before `dev` and `build`.
import { copyFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
const dist = path.dirname(require.resolve("maplibre-gl/package.json"));
const ziel = path.join(import.meta.dirname, "..", "public", "vendor");
mkdirSync(ziel, { recursive: true });
copyFileSync(path.join(dist, "dist", "maplibre-gl-worker.mjs"), path.join(ziel, "maplibre-gl-worker.mjs"));

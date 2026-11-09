/** Loads MapLibre in browser runtime and configures web worker asset path. */
export async function loadMaplibre() {
  const maplibregl = await import("maplibre-gl");
  if (maplibregl.getWorkerUrl() !== "/vendor/maplibre-gl-worker.mjs") {
    maplibregl.setWorkerUrl("/vendor/maplibre-gl-worker.mjs");
  }
  return maplibregl;
}

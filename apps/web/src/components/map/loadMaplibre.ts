let pmtilesProtocolRegistered = false;

/** Loads MapLibre in browser runtime, configures web worker asset path, and registers PMTiles protocol. */
export async function loadMaplibre() {
  const [maplibregl, pmtiles] = await Promise.all([
    import("maplibre-gl"),
    import("pmtiles"),
  ]);
  if (maplibregl.getWorkerUrl() !== "/vendor/maplibre-gl-worker.mjs") {
    maplibregl.setWorkerUrl("/vendor/maplibre-gl-worker.mjs");
  }
  if (!pmtilesProtocolRegistered && typeof maplibregl.addProtocol === "function") {
    try {
      const protocol = new pmtiles.Protocol();
      maplibregl.addProtocol("pmtiles", protocol.tile);
      pmtilesProtocolRegistered = true;
    } catch {
      // Ignore if protocol was already registered
    }
  }
  return maplibregl;
}

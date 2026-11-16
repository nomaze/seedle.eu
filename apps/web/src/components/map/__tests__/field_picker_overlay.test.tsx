import fs from "node:fs";
import path from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { hasSelfIntersection } from "@seedle/core/geo";
import {
  buildPolygonFromPoints,
  clipPolygonByHalfPlane,
  computeEdgeMidpoint,
  extractFiboaFeatureParcel,
  FieldPicker,
  insertVertexOnEdge,
  mergeTwoPolygonsIntoOne,
  stitchPolygonRingsList,
} from "../FieldPicker";
import {
  attachMapErrorShield,
  FIBOA_PMTILES_URL,
  KARTE,
  LUFTBILD,
} from "../styles";
import { isPassiveHoverTarget } from "@/components/spross/SprossContext";
import {
  BugReportWidget,
  captureInstantPageScreenshot,
} from "@/components/shell/BugReportWidget";
import { buildDeterministicWeatherHistory10Y } from "@/lib/fieldWeatherHistory";

// Router mock
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => "/feld/neu",
}));

describe("FieldPicker & Spross Overlay Stacking (z-40 / z-30)", () => {
  it("renders search field overlay explicitly with z-40 above the map canvas", () => {
    const html = renderToStaticMarkup(<FieldPicker mode="neu" />);

    // Verify search overlay container styling
    expect(html).toContain('class="absolute left-3 right-14 top-3 z-40 sm:right-auto sm:w-96"');
    // Search input target attribute must be present
    expect(html).toContain('data-spross-target="ort-search"');
  });

  it("renders the clear Satellit / Karte switcher and field boundary orientation notice", () => {
    const html = renderToStaticMarkup(<FieldPicker mode="neu" />);
    expect(html).not.toContain("Luftbild");
    expect(html).toContain("Satellit");
    expect(html).toContain("Karte");
    expect(html).toContain("Feldgrenzen-Orientierung aktiv");
    expect(html).toContain("Eckpunkte neu antippen");
  });

  it("supports multi-vertex edge splitting (5, 6, 8, 12+ vertices) and freehand polygon building", () => {
    const basePoly = {
      type: "Polygon" as const,
      coordinates: [
        [
          [11.7, 48.4] as [number, number],
          [11.71, 48.4] as [number, number],
          [11.71, 48.41] as [number, number],
          [11.7, 48.41] as [number, number],
          [11.7, 48.4] as [number, number],
        ],
      ],
    };
    const mid = computeEdgeMidpoint([11.7, 48.4], [11.71, 48.4]);
    expect(mid).toEqual([11.705, 48.4]);

    const poly5 = insertVertexOnEdge(basePoly, 0);
    expect(poly5.coordinates[0]!.length - 1).toBe(5);

    const poly6 = insertVertexOnEdge(poly5, 2);
    expect(poly6.coordinates[0]!.length - 1).toBe(6);

    expect(buildPolygonFromPoints([[11.7, 48.4], [11.71, 48.4]])).toBeNull();
    const customPoly = buildPolygonFromPoints([
      [11.7, 48.4],
      [11.71, 48.4],
      [11.71, 48.41],
      [11.705, 48.415],
      [11.7, 48.41],
    ]);
    expect(customPoly?.coordinates[0]?.length).toBe(6);
  });

  it("maintains clean CSS isolation (isolate / relative overflow-hidden) on map container", () => {
    const html = renderToStaticMarkup(<FieldPicker mode="neu" />);

    // Outer container must declare isolate, relative, and overflow-hidden
    expect(html).toContain("relative isolate overflow-hidden rounded-card");
    // Map canvas element possesses data-spross-target="field-map"
    expect(html).toContain('data-spross-target="field-map"');
  });

  describe("SprossContext passive mouse hover highlighting", () => {
    it("ignores passive mouse hover over field-map canvas (prevents unwanted full-canvas highlight pulse)", () => {
      // isPassiveHoverTarget must return false for field-map
      expect(isPassiveHoverTarget("field-map")).toBe(false);
    });

    it("permits passive hover highlighting for standard UI targets (e.g. ort-search, feld-button)", () => {
      expect(isPassiveHoverTarget("ort-search")).toBe(true);
      expect(isPassiveHoverTarget("feld-button")).toBe(true);
      expect(isPassiveHoverTarget("daten-button")).toBe(true);
      expect(isPassiveHoverTarget(null)).toBe(false);
      expect(isPassiveHoverTarget(undefined)).toBe(false);
    });

    it("simulates mouse hover event: ignores data-spross-target='field-map' and processes other targets", () => {
      let activeHighlight: string | null = null;
      const simulateMouseOver = (targetAttr: string) => {
        if (!isPassiveHoverTarget(targetAttr)) return;
        activeHighlight = targetAttr;
      };

      // Hover over map canvas must never trigger highlight state
      simulateMouseOver("field-map");
      expect(activeHighlight).toBeNull();

      // Hover over location search sets active highlight as expected
      simulateMouseOver("ort-search");
      expect(activeHighlight).toBe("ort-search");
    });
  });

  describe("FieldPicker Interaction & Feedback Elements", () => {
    it("renders initial prompt instructing user to pick a parcel", () => {
      const html = renderToStaticMarkup(<FieldPicker mode="neu" />);
      expect(html).toContain("Such deinen Ort und tipp dann auf dein Feld.");
    });

    it("renders confirmation button 'Weiter mit diesem Feld' when polygon is initially provided", () => {
      const mockPolygon = {
        type: "Polygon" as const,
        coordinates: [
          [
            [11.7, 48.4] as [number, number],
            [11.71, 48.4] as [number, number],
            [11.71, 48.41] as [number, number],
            [11.7, 48.41] as [number, number],
            [11.7, 48.4] as [number, number],
          ],
        ],
      };
      const html = renderToStaticMarkup(<FieldPicker mode="neu" initial={mockPolygon} />);
      expect(html).toContain("Weiter mit diesem Feld");
      expect(html).toContain("Grenze anpassen");
    });
  });

  describe("Cartographic Style Specifications & Base Tile Regression Guards", () => {
    it("uses real Esri World Imagery satellite raster style for LUFTBILD and OpenFreeMap for KARTE", () => {
      expect(KARTE).toBe("https://tiles.openfreemap.org/styles/liberty");
      expect(LUFTBILD).not.toEqual(KARTE);
      const serialized = JSON.stringify(LUFTBILD);
      expect(serialized).toContain("World_Imagery");
      expect(serialized).not.toContain("tile.openstreetmap.org");
    });

    it("renders the Feldkarte / Schläge cadastral toggle enabled by default", () => {
      const html = renderToStaticMarkup(<FieldPicker mode="neu" />);
      expect(html).toContain('data-testid="flurkarte-toggle-btn"');
      expect(html).toContain("Feldkarte / Schläge an");
    });

    it("attaches error and missing-sprite shield (attachMapErrorShield) without throwing console.error", () => {
      const listeners: Record<string, (ev: unknown) => void> = {};
      const addedImages: Record<string, unknown> = {};
      let fallbackCalled = 0;

      const fakeMap = {
        on: (event: string, cb: (ev: unknown) => void) => {
          listeners[event] = cb;
        },
        hasImage: (id: string) => Boolean(addedImages[id]),
        addImage: (id: string, img: unknown) => {
          addedImages[id] = img;
        },
        setStyle: vi.fn(),
      };

      attachMapErrorShield(fakeMap as never, () => {
        fallbackCalled += 1;
      });

      // Trigger missing sprite event ("office", "bollard")
      listeners["styleimagemissing"]?.({ id: "office" });
      listeners["styleimagemissing"]?.({ id: "bollard" });
      expect(addedImages["office"]).toBeDefined();
      expect(addedImages["bollard"]).toBeDefined();

      // Trigger blocked Esri tile AJAXError (status 0) -> triggers fallback once
      listeners["error"]?.({
        sourceId: "esri-world-imagery",
        error: { message: "AJAXError: Failed to fetch (0): https://server.arcgisonline.com/...", status: 0 },
      });
      listeners["error"]?.({
        sourceId: "esri-world-imagery",
        error: { message: "AJAXError: Failed to fetch (0)", status: 0 },
      });
      expect(fallbackCalled).toBe(1);
    });

    it("permits https://server.arcgisonline.com, https://data.source.coop, and public geodata APIs (Overpass & NRW OGC) in the layout Content-Security-Policy", () => {
      const layoutPath = path.resolve(__dirname, "../../../app/layout.tsx");
      const layoutSource = fs.readFileSync(layoutPath, "utf8");
      expect(layoutSource).toContain(
        "img-src 'self' data: blob: https://tiles.openfreemap.org https://server.arcgisonline.com https://*.arcgisonline.com https://tiles.maps.eox.at",
      );
      expect(layoutSource).toContain("https://data.source.coop");
      expect(layoutSource).toContain("https://overpass-api.de");
      expect(layoutSource).toContain("https://overpass.kumi.systems");
      expect(layoutSource).toContain("https://ogc-api.nrw.de");
      expect(layoutSource).toContain("https://archive-api.open-meteo.com");
      expect(layoutSource).toContain("https://server.arcgisonline.com");
      expect(layoutSource).toContain('"http://localhost:8010"');
      expect(layoutSource).toContain('"http://127.0.0.1:8010"');
    });

    it("computes deterministic 10-year field weather history (2016 to 2025) and renders field-weather-10y-section", () => {
      const history = buildDeterministicWeatherHistory10Y(48.4028, 11.7489);
      expect(history.years).toHaveLength(10);
      expect(history.years[0]!.year).toBe(2016);
      expect(history.years[9]!.year).toBe(2025);
      expect(history.droughtYearsCount).toBeGreaterThanOrEqual(2);
      expect(history.avgPrecipTotalMm).toBeGreaterThan(450);
      expect(history.avgGrowingDegreeDays).toBeGreaterThan(1000);
      expect(history.avgPrecipFloweringMm).toBeGreaterThan(35);
      expect(history.avgEffectivePrecipVegMm).toBeGreaterThan(90);
      expect(history.avgEffectivePrecipVegMm).toBeLessThanOrEqual(history.avgPrecipVegMm);
      expect(history.diseasePressureHint.length).toBeGreaterThan(20);
      expect(history.years[0]!.precipFloweringMm).toBeGreaterThan(30);
      expect(history.years[0]!.effectivePrecipVegMm).toBeGreaterThan(80);
      expect(history.years[0]!.heavyRainDays25Mm).toBeGreaterThanOrEqual(0);

      const y2018 = history.years.find((y) => y.year === 2018);
      const y2022 = history.years.find((y) => y.year === 2022);
      expect(y2018?.yearType).toBe("Trockenjahr");
      expect(y2022?.yearType).toBe("Trockenjahr");

      // Verify Block A: siteCharacter (4 traits, regional classification, zero forbidden punctuation)
      expect(history.siteCharacter).toBeDefined();
      expect(history.siteCharacter.traits).toHaveLength(4);
      expect(history.siteCharacter.traits.map((t) => t.id)).toEqual([
        "water_balance",
        "spring_cold",
        "flowering_heat",
        "autumn_maturity",
      ]);
      expect(history.siteCharacter.recommendedMaturityRange).toContain("Reifegruppe S");

      // Regional agro-climatology checks across Germany
      const brandenburg = buildDeterministicWeatherHistory10Y(51.75, 14.33);
      expect(brandenburg.siteCharacter.primaryBadge).toBe("Trockenstress-Standort");
      expect(brandenburg.siteCharacter.summerWaterBalanceMm).toBeLessThan(-100);

      const franken = buildDeterministicWeatherHistory10Y(49.79, 9.95);
      expect(franken.siteCharacter.primaryBadge).toBe("Trockenstress-Standort");

      const oberrhein = buildDeterministicWeatherHistory10Y(48.0, 7.85);
      expect(oberrhein.siteCharacter.primaryBadge).toBe("Trockenstress-Standort");

      const voralpen = buildDeterministicWeatherHistory10Y(47.75, 10.32);
      expect(voralpen.siteCharacter.primaryBadge).toBe("Feuchter Ertragsstandort");

      const kueste = buildDeterministicWeatherHistory10Y(54.48, 9.05);
      expect(kueste.siteCharacter.primaryBadge).toBe("Feuchter Ertragsstandort");

      const mittelgebirge = buildDeterministicWeatherHistory10Y(50.43, 12.95);
      expect(mittelgebirge.siteCharacter.primaryBadge).toBe(
        "Kühle Höhen- oder Spätfrostlage",
      );

      // Verify Block B: climateOutlookNextYear (5 models compared)
      expect(history.climateOutlookNextYear.targetYear).toBe(2027);
      expect(history.climateOutlookNextYear.models).toHaveLength(5);
      expect(history.climateOutlookNextYear.models.map((m) => m.modelId)).toEqual([
        "dwd_gcfs",
        "ecmwf_seas5",
        "mpi_esm_hr",
        "meteo_france",
        "ukmo_glosea6",
      ]);

      // Ensure no forbidden punctuation (—, –, " - ", ;) in siteCharacter or climateOutlookNextYear strings
      const allStrings = [
        history.siteCharacter.headline,
        history.siteCharacter.recommendedMaturityRange,
        ...history.siteCharacter.traits.flatMap((t) => [
          t.label,
          t.statusLabel,
          t.metricValue,
          t.farmerAdvice,
        ]),
        history.climateOutlookNextYear.consensusHeadline,
        history.climateOutlookNextYear.consensusAdvice,
        ...history.climateOutlookNextYear.models.flatMap((m) => [
          m.modelName,
          m.seasonSummary,
        ]),
      ];
      for (const txt of allStrings) {
        expect(txt).not.toContain("—");
        expect(txt).not.toContain("–");
        expect(txt).not.toContain(" - ");
        expect(txt).not.toContain(";");
      }

      const mockPolygon = {
        type: "Polygon" as const,
        coordinates: [
          [
            [11.7, 48.4] as [number, number],
            [11.71, 48.4] as [number, number],
            [11.71, 48.41] as [number, number],
            [11.7, 48.41] as [number, number],
            [11.7, 48.4] as [number, number],
          ],
        ],
      };
      // Default state: weather and site profile sections are collapsed so the main CTA is immediately visible
      const collapsedHtml = renderToStaticMarkup(<FieldPicker mode="neu" initial={mockPolygon} />);
      expect(collapsedHtml).toContain('data-testid="toggle-field-weather-10y-btn"');
      expect(collapsedHtml).toContain(
        "10 Jahre Schlagwetter und Klimamodelle aufklappen (2016 bis 2025)",
      );
      expect(collapsedHtml).not.toContain('data-testid="field-weather-10y-section"');

      // Expanded state: renders full 10Y weather, site character, and 5-model outlook
      const html = renderToStaticMarkup(
        <FieldPicker mode="neu" initial={mockPolygon} defaultWeatherOpen={true} />,
      );
      expect(html).toContain('data-testid="field-weather-10y-section"');
      expect(html).toContain('data-testid="field-site-character-box"');
      expect(html).toContain("Standort-Charakter deines Schlags");
      expect(html).toContain("Wasserhaushalt und Trockenstress");
      expect(html).toContain("Frühjahrserwärmung und Spätfrost");
      expect(html).toContain("Blütezeit im Juli");
      expect(html).toContain("Herbstabreife und Standfestigkeit");
      expect(html).toContain('data-testid="field-climate-outlook-box"');
      expect(html).toContain(
        "Klima-Ausblick für das nächste Anbaujahr (5 Modelle im Vergleich)",
      );
      expect(html).toContain("DWD Deutschland");
      expect(html).toContain("ECMWF Europa");
      expect(html).toContain("MPI Klimamodell");
      expect(html).toContain("Météo France");
      expect(html).toContain("UK Met Office");
      expect(html).toContain("Blüteregen Juli");
      expect(html).toContain("Starkregentage");
      expect(html).toContain("2016");
      expect(html).toContain("2018");
      expect(html).toContain("2022");
      expect(html).toContain("2025");
      expect(html).toContain("Trockenjahr");
    });

    it("renders fiboa PMTiles configuration, Overzoom maxzoom: 17, Merge & Split tools without emojis, and real field metadata panel", () => {
      expect(FIBOA_PMTILES_URL).toBe(
        "pmtiles://https://data.source.coop/ftw/harmonized-field-data/harmonized-field-data.pmtiles",
      );
      expect(LUFTBILD.sources["esri-world-imagery"]).toMatchObject({ maxzoom: 17 });

      const pickerSource = fs.readFileSync(path.resolve(__dirname, "../FieldPicker.tsx"), "utf8");
      expect(pickerSource).not.toContain("surroundingFieldParcels");
      expect(pickerSource).toContain("fiboa-fields");
      expect(pickerSource).toContain("fetchRealFieldBoundaryAtPoint");
      expect(pickerSource).toContain("preserveDrawingBuffer: true");

      const bugWidgetHtml = renderToStaticMarkup(<BugReportWidget />);
      expect(bugWidgetHtml).toContain('data-testid="open-bug-report-btn"');
      expect(bugWidgetHtml).toContain("Bug oder Feedback melden");
      const snap = captureInstantPageScreenshot({ xPct: 50, yPct: 50 });
      expect(snap.startsWith("data:image/png;base64,")).toBe(true);

      const mockPolygon = {
        type: "Polygon" as const,
        coordinates: [
          [
            [11.7, 48.4] as [number, number],
            [11.71, 48.4] as [number, number],
            [11.71, 48.41] as [number, number],
            [11.7, 48.41] as [number, number],
            [11.7, 48.4] as [number, number],
          ],
        ],
      };
      const html = renderToStaticMarkup(
        <FieldPicker mode="neu" initial={mockPolygon} defaultSteckbriefOpen={true} />,
      );
      expect(html).toContain('data-testid="real-field-info-panel"');
      expect(html).toContain('data-testid="merge-neighbor-btn"');
      expect(html).toContain("Nachbarschlag dazunehmen");
      expect(html).toContain('data-testid="split-field-btn"');
      expect(html).toContain("Schlag teilen");
      expect(html).toContain('data-testid="toggle-field-steckbrief-btn"');
      expect(html).toContain(
        "Standortwerte und Bodenprofil aufklappen (Bodenart · Ackerzahl · Höhenlage)",
      );
      expect(html).toContain('data-testid="expanded-field-steckbrief"');
      expect(html).toContain("Amtliche Schlag-ID (FLIK)");
      expect(html).toContain("Bodenart");
      expect(html).toContain("Ackerzahl / Bodenpunkte");

      // Verify clipPolygonByHalfPlane splits a square in two halves and mergeTwoPolygonsIntoOne fuses them
      const partA = clipPolygonByHalfPlane(mockPolygon, [11.705, 48.39], [11.705, 48.42], 1);
      const partB = clipPolygonByHalfPlane(mockPolygon, [11.705, 48.39], [11.705, 48.42], -1);
      expect(partA).not.toBeNull();
      expect(partB).not.toBeNull();
      const merged = mergeTwoPolygonsIntoOne(partA!, partB!);
      expect(merged.coordinates[0]!.length).toBe(5);

      // Regression guard for bug_20261113_100951_40e2f0:
      // Stitch MVT vector-tile-clipped field fragments that overlap across a vertical tile buffer seam
      const leftTileBufferedRing: [number, number][] = [
        [9.916, 48.389],
        [9.9182, 48.389], // extends +0.0002 deg into tile buffer past seam 9.918
        [9.9182, 48.391],
        [9.916, 48.391],
        [9.916, 48.389],
      ];
      const rightTileBufferedRing: [number, number][] = [
        [9.9178, 48.389], // extends -0.0002 deg into tile buffer before seam 9.918
        [9.92, 48.389],
        [9.92, 48.391],
        [9.9178, 48.391],
        [9.9178, 48.389],
      ];
      const stitched = stitchPolygonRingsList([
        leftTileBufferedRing,
        rightTileBufferedRing,
      ]);
      expect(stitched).not.toBeNull();
      // The stitched outer ring must be the clean 4-corner full field [9.916..9.920] without internal vertical cut line
      expect(stitched!.coordinates[0]!.length).toBe(5);
      const lons = stitched!.coordinates[0]!.map((pt) => pt[0]);
      expect(Math.min(...lons)).toBeCloseTo(9.916, 5);
      expect(Math.max(...lons)).toBeCloseTo(9.92, 5);

      // Also verify extractFiboaFeatureParcel stitches multi-tile fragments from bug_20261113_100951_40e2f0
      // (lat: 48.389793, lon: 9.917105, Schlag Allewind de_bw 15ebb6de-3def-4fbd-8207-c0bd8bfb7e...)
      // even when the vertical tile cut edge has unequal segment lengths or different tile-level numeric IDs
      const allewindWestHalf: [number, number][] = [
        [9.916191, 48.389254],
        [9.917323, 48.3896],
        [9.917323, 48.390122], // vertical tile cut at lon = 9.917323
        [9.91596, 48.389664],
        [9.916191, 48.389254],
      ];
      const allewindEastHalf: [number, number][] = [
        [9.917323, 48.3896],
        [9.918814, 48.390077],
        [9.918492, 48.390476],
        [9.917323, 48.390122], // matching vertical tile cut at lon = 9.917323
        [9.917323, 48.3896],
      ];
      const fakeMapForStitch = {
        getLayer: (id: string) => (id === "fiboa-fields-fill" ? {} : undefined),
        queryRenderedFeatures: () => [
          {
            id: 101,
            properties: {
              id: "15ebb6de-3def-4fbd-8207-c0bd8bfb7e00",
              collection: "de_bw",
              "metrics:area": 36000,
            },
            geometry: { type: "Polygon", coordinates: [allewindWestHalf] },
          },
          {
            id: 202,
            properties: {
              // Simulates a second tile fragment where `id` is missing or numeric but `metrics:area` and seam match
              collection: "de_bw",
              "metrics:area": 36000,
            },
            geometry: { type: "Polygon", coordinates: [allewindEastHalf] },
          },
        ],
        querySourceFeatures: () => [],
      };
      const extractedAllewind = extractFiboaFeatureParcel(
        fakeMapForStitch as never,
        {
          id: 101,
          properties: {
            id: "15ebb6de-3def-4fbd-8207-c0bd8bfb7e00",
            collection: "de_bw",
            "metrics:area": 36000,
          },
          geometry: { type: "Polygon", coordinates: [allewindWestHalf] },
        },
      );
      expect(extractedAllewind).not.toBeNull();
      const extractedLons = extractedAllewind!.polygon.coordinates[0]!.map((pt) => pt[0]);
      expect(Math.min(...extractedLons)).toBeCloseTo(9.91596, 4);
      expect(Math.max(...extractedLons)).toBeCloseTo(9.918814, 4);
    });
  });

  describe("Single red fill source and merge winding robustness (SEEDLE-FIX-DOUBLE-RED-FILL-20261116)", () => {
    it("uses feld-flaeche/feld-rand as the single visible red selection source without double-stacked fiboa selected layers", () => {
      const pickerSource = fs.readFileSync(
        path.resolve(__dirname, "../FieldPicker.tsx"),
        "utf8",
      );

      // The unified GeoJSON field layers remain the single visible red selection source.
      expect(pickerSource).toContain(
        'id: "feld-flaeche"',
      );
      expect(pickerSource).toContain(
        'paint: { "fill-color": feldFarbe().fill, "fill-opacity": 0.34 }',
      );
      expect(pickerSource).toContain('id: "feld-rand"');

      // Selected fiboa vector layers must be kept for compatibility but rendered invisibly
      // to prevent double-stacked 0.34 + 0.34 fill opacity and MVT tile-buffer overlap artifacts.
      expect(pickerSource).toContain('id: "fiboa-fields-selected-fill"');
      expect(pickerSource).toContain('"fill-opacity": 0');
      expect(pickerSource).toContain('id: "fiboa-fields-selected-outline"');
      expect(pickerSource).toContain('"line-opacity": 0');
    });

    it("merges adjacent polygons into a clean non-self-intersecting outer boundary regardless of CW/CCW ring winding order", () => {
      const polyA: [number, number][] = [
        [10.0, 48.0],
        [10.01, 48.0],
        [10.01, 48.01],
        [10.0, 48.01],
        [10.0, 48.0],
      ];
      // Adjacent polygon to the east sharing the vertical seam edge.
      const polyBCcw: [number, number][] = [
        [10.01, 48.0],
        [10.02, 48.0],
        [10.02, 48.01],
        [10.01, 48.01],
        [10.01, 48.0],
      ];
      // Same shape in opposite winding/traversal order (CW).
      const polyBCw: [number, number][] = [...polyBCcw.slice(0, -1)].reverse();
      polyBCw.push(polyBCw[0]!);

      const toPolygon = (ring: [number, number][]) => ({
        type: "Polygon" as const,
        coordinates: [ring],
      });

      const mergedCcw = mergeTwoPolygonsIntoOne(toPolygon(polyA), toPolygon(polyBCcw));
      expect(hasSelfIntersection(mergedCcw)).toBe(false);
      expect(mergedCcw.coordinates[0]!.length).toBeGreaterThanOrEqual(4);

      const mergedCw = mergeTwoPolygonsIntoOne(toPolygon(polyA), toPolygon(polyBCw));
      expect(hasSelfIntersection(mergedCw)).toBe(false);
      expect(mergedCw.coordinates[0]!.length).toBeGreaterThanOrEqual(4);

      const mergedLons = mergedCw.coordinates[0]!.map((pt) => pt[0]);
      expect(Math.min(...mergedLons)).toBeCloseTo(10.0, 6);
      expect(Math.max(...mergedLons)).toBeCloseTo(10.02, 6);
    });
  });
});

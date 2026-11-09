import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { FieldPicker } from "../FieldPicker";
import { KARTE, LUFTBILD } from "../styles";
import { isPassiveHoverTarget } from "@/components/spross/SprossContext";

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

  it("hides the satellite/map toggle button for the public launch", () => {
    const html = renderToStaticMarkup(<FieldPicker mode="neu" />);
    expect(html).not.toContain("Luftbild");
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
    it("never includes proprietary Esri, arcgisonline.com, or tile.openstreetmap.org in styles", () => {
      const serialized = JSON.stringify({ KARTE, LUFTBILD });
      expect(serialized).not.toContain("arcgisonline.com");
      expect(serialized).not.toContain("server.arcgisonline.com");
      expect(serialized).not.toContain("tile.openstreetmap.org");
    });

    it("routes KARTE and LUFTBILD exclusively through tiles.openfreemap.org", () => {
      expect(KARTE).toBe("https://tiles.openfreemap.org/styles/liberty");
      expect(LUFTBILD).toBe("https://tiles.openfreemap.org/styles/liberty");
    });
  });
});

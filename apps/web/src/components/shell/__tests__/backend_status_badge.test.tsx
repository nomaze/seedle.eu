import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEMO_STANDARD } from "@/lib/demo";
import * as backendClientModule from "@/lib/backendClient";
import { BackendStatusBadge } from "../BackendStatusBadge";
import { BrandBar } from "../BrandBar";
import { DemoProvider, useDemo, type DemoContextValue } from "../DemoContext";
import { LanguageProvider } from "../LanguageContext";
import { DemoSettingsForm } from "@/components/demo/DemoSettingsForm";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn(),
    push: vi.fn(),
    replace: vi.fn(),
  }),
  usePathname: () => "/",
}));

describe("Header Backend Status Badge & Settings Toggle (SEEDLE-FEAT-002)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("1. Offline / Test-Modus Rendering", () => {
    it("renders offline status badge linking to /demo when backend is offline in German", () => {
      const html = renderToStaticMarkup(
        <LanguageProvider initialLocale="de">
          <DemoProvider value={{ ...DEMO_STANDARD, showBackendStatusBadge: true }}>
            <BackendStatusBadge initialHealth={null} />
          </DemoProvider>
        </LanguageProvider>,
      );

      expect(html).toContain('data-testid="backend-status-badge"');
      expect(html).toContain('href="/demo"');
      expect(html).toContain("Momentan ohne Backend (Test-Modus)");
      expect(html).toContain("bg-bee");
    });

    it("renders offline status badge linking to /demo when backend is offline in English", () => {
      const html = renderToStaticMarkup(
        <LanguageProvider initialLocale="en">
          <DemoProvider value={{ ...DEMO_STANDARD, showBackendStatusBadge: true }}>
            <BackendStatusBadge initialHealth={null} />
          </DemoProvider>
        </LanguageProvider>,
      );

      expect(html).toContain('data-testid="backend-status-badge"');
      expect(html).toContain('href="/demo"');
      expect(html).toContain("Offline mode (no backend)");
      expect(html).toContain("bg-bee");
    });
  });

  describe("2. Connected / Online Rendering", () => {
    const mockHealthy = {
      status: "healthy",
      version: "0.1.0",
      uptime_seconds: 42.5,
      timestamp: "2026-11-08T12:00:00Z",
    };

    it("renders connected status badge in green when backend is online and healthy in German", () => {
      const html = renderToStaticMarkup(
        <LanguageProvider initialLocale="de">
          <DemoProvider value={{ ...DEMO_STANDARD, showBackendStatusBadge: true }}>
            <BackendStatusBadge initialHealth={mockHealthy} />
          </DemoProvider>
        </LanguageProvider>,
      );

      expect(html).toContain('data-testid="backend-status-badge"');
      expect(html).toContain('href="/demo"');
      expect(html).toContain("Backend verbunden");
      expect(html).toContain("bg-status-ok");
    });

    it("renders connected status badge in green when backend is online and healthy in English", () => {
      const html = renderToStaticMarkup(
        <LanguageProvider initialLocale="en">
          <DemoProvider value={{ ...DEMO_STANDARD, showBackendStatusBadge: true }}>
            <BackendStatusBadge initialHealth={mockHealthy} />
          </DemoProvider>
        </LanguageProvider>,
      );

      expect(html).toContain('data-testid="backend-status-badge"');
      expect(html).toContain('href="/demo"');
      expect(html).toContain("Backend connected");
      expect(html).toContain("bg-status-ok");
    });
  });

  describe("3. Toggle Off Behavior", () => {
    it("renders null and does not mount badge when showBackendStatusBadge is false", () => {
      const checkHealthSpy = vi.spyOn(backendClientModule, "checkBackendHealth");

      const html = renderToStaticMarkup(
        <LanguageProvider initialLocale="de">
          <DemoProvider value={{ ...DEMO_STANDARD, showBackendStatusBadge: false }}>
            <BackendStatusBadge />
          </DemoProvider>
        </LanguageProvider>,
      );

      expect(html).not.toContain("backend-status-badge");
      expect(html).not.toContain("Momentan ohne Backend");
      expect(html).not.toContain("Backend verbunden");
      expect(checkHealthSpy).not.toHaveBeenCalled();
    });
  });

  describe("4. BrandBar Header Integration", () => {
    it("displays the status badge within BrandBar header when enabled", () => {
      const html = renderToStaticMarkup(
        <LanguageProvider initialLocale="de">
          <DemoProvider value={{ ...DEMO_STANDARD, showBackendStatusBadge: true }}>
            <BrandBar />
          </DemoProvider>
        </LanguageProvider>,
      );

      expect(html).toContain('data-testid="backend-status-badge"');
      expect(html).toContain("Momentan ohne Backend (Test-Modus)");
    });

    it("hides the status badge from BrandBar header when disabled", () => {
      const html = renderToStaticMarkup(
        <LanguageProvider initialLocale="de">
          <DemoProvider value={{ ...DEMO_STANDARD, showBackendStatusBadge: false }}>
            <BrandBar />
          </DemoProvider>
        </LanguageProvider>,
      );

      expect(html).not.toContain('data-testid="backend-status-badge"');
    });

    it("renders compact labels for mobile screens (< sm) to prevent header overflow on 390px viewports", () => {
      const htmlDe = renderToStaticMarkup(
        <LanguageProvider initialLocale="de">
          <DemoProvider value={{ ...DEMO_STANDARD, showBackendStatusBadge: true }}>
            <BackendStatusBadge initialHealth={null} />
          </DemoProvider>
        </LanguageProvider>,
      );

      expect(htmlDe).toContain("Test-Modus");
      expect(htmlDe).toContain("whitespace-nowrap");

      const htmlEn = renderToStaticMarkup(
        <LanguageProvider initialLocale="en">
          <DemoProvider value={{ ...DEMO_STANDARD, showBackendStatusBadge: true }}>
            <BackendStatusBadge initialHealth={null} />
          </DemoProvider>
        </LanguageProvider>,
      );

      expect(htmlEn).toContain("Offline");
      expect(htmlEn).toContain("whitespace-nowrap");
    });
  });

  describe("5. DemoSettingsForm & DemoContext Integration", () => {
    it("renders the backend badge toggle checkbox in DemoSettingsForm (/demo) with localized copy", () => {
      const htmlDe = renderToStaticMarkup(
        <LanguageProvider initialLocale="de">
          <DemoProvider value={DEMO_STANDARD}>
            <DemoSettingsForm initialSettings={DEMO_STANDARD} />
          </DemoProvider>
        </LanguageProvider>,
      );

      expect(htmlDe).toContain('data-testid="toggle-backend-status-badge"');
      expect(htmlDe).toContain("Backend-Status im Header anzeigen");
      expect(htmlDe).toContain(
        "Zeigt oben in der Kopfleiste an, ob die App lokal ohne Backend (Test-Modus) oder mit verbundenem Backend läuft.",
      );

      const htmlEn = renderToStaticMarkup(
        <LanguageProvider initialLocale="en">
          <DemoProvider value={DEMO_STANDARD}>
            <DemoSettingsForm initialSettings={DEMO_STANDARD} />
          </DemoProvider>
        </LanguageProvider>,
      );

      expect(htmlEn).toContain("Show backend status in header");
      expect(htmlEn).toContain(
        "Displays a badge in the top navigation indicating whether the app is running without a backend (test mode) or connected to the backend.",
      );
    });

    it("allows updating and resetting showBackendStatusBadge in DemoContext", () => {
      let capturedContext: DemoContextValue | undefined;
      function ContextCapture() {
        capturedContext = useDemo();
        return null;
      }

      renderToStaticMarkup(
        <DemoProvider value={{ ...DEMO_STANDARD, showBackendStatusBadge: true }}>
          <ContextCapture />
        </DemoProvider>,
      );

      expect(capturedContext?.showBackendStatusBadge).toBe(true);

      capturedContext?.updateDemo({ showBackendStatusBadge: false });
      capturedContext?.resetDemo();
      expect(capturedContext?.showBackendStatusBadge).toBe(true);
    });
  });
});

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

  describe("1. Offline / Disconnected Red Alert Rendering", () => {
    it("renders a visible red alert badge ('Kein Backend verbunden') linking to /demo when backend is offline in German", () => {
      const html = renderToStaticMarkup(
        <LanguageProvider initialLocale="de">
          <DemoProvider value={{ ...DEMO_STANDARD, showBackendStatusBadge: true }}>
            <BackendStatusBadge initialHealth={null} />
          </DemoProvider>
        </LanguageProvider>,
      );

      expect(html).toContain('data-testid="backend-status-badge"');
      expect(html).toContain('data-testid="backend-disconnected-red-alert"');
      expect(html).toContain('href="/demo"');
      expect(html).toContain(
        'title="Kein Backend verbunden · Klickdummy zeigt aktuell Demo- und Schätzwerte"',
      );
      expect(html).toContain(
        'aria-label="Kein Backend verbunden · Klickdummy zeigt aktuell Demo- und Schätzwerte"',
      );
      expect(html).toContain("bg-[#e05a47]");
      expect(html).toContain("bg-[#fdf2f0]");
      expect(html).toContain("text-[#b42318]");
      expect(html).toContain("border-[#e05a47]");
      expect(html).toContain("rounded-full");
      expect(html).toContain("size-2.5");
      expect(html).toContain("Kein Backend verbunden");
    });

    it("renders a visible red alert badge ('No backend connected') linking to /demo when backend is offline in English", () => {
      const html = renderToStaticMarkup(
        <LanguageProvider initialLocale="en">
          <DemoProvider value={{ ...DEMO_STANDARD, showBackendStatusBadge: true }}>
            <BackendStatusBadge initialHealth={null} />
          </DemoProvider>
        </LanguageProvider>,
      );

      expect(html).toContain('data-testid="backend-status-badge"');
      expect(html).toContain('data-testid="backend-disconnected-red-alert"');
      expect(html).toContain('href="/demo"');
      expect(html).toContain('title="Offline mode (no backend) · Showing demo estimates"');
      expect(html).toContain(
        'aria-label="Offline mode (no backend) · Showing demo estimates"',
      );
      expect(html).toContain("bg-[#e05a47]");
      expect(html).toContain("bg-[#fdf2f0]");
      expect(html).toContain("text-[#b42318]");
      expect(html).toContain("border-[#e05a47]");
      expect(html).toContain("rounded-full");
      expect(html).toContain("size-2.5");
      expect(html).toContain("No backend connected");
    });
  });

  describe("2. Connected / Online Rendering", () => {
    const mockHealthy = {
      status: "healthy",
      version: "0.1.0",
      uptime_seconds: 42.5,
      timestamp: "2026-11-08T12:00:00Z",
    };

    it("renders a clean green status dot when backend is online and healthy in German", () => {
      const html = renderToStaticMarkup(
        <LanguageProvider initialLocale="de">
          <DemoProvider value={{ ...DEMO_STANDARD, showBackendStatusBadge: true }}>
            <BackendStatusBadge initialHealth={mockHealthy} />
          </DemoProvider>
        </LanguageProvider>,
      );

      expect(html).toContain('data-testid="backend-status-badge"');
      expect(html).toContain('href="/demo"');
      expect(html).toContain('title="Backend verbunden"');
      expect(html).toContain('aria-label="Backend verbunden"');
      expect(html).toContain("bg-status-ok");
      expect(html).toContain("rounded-full");
      expect(html).toContain("size-2.5");
      expect(html).not.toContain('data-testid="backend-disconnected-red-alert"');
    });

    it("renders a clean green status dot when backend is online and healthy in English", () => {
      const html = renderToStaticMarkup(
        <LanguageProvider initialLocale="en">
          <DemoProvider value={{ ...DEMO_STANDARD, showBackendStatusBadge: true }}>
            <BackendStatusBadge initialHealth={mockHealthy} />
          </DemoProvider>
        </LanguageProvider>,
      );

      expect(html).toContain('data-testid="backend-status-badge"');
      expect(html).toContain('href="/demo"');
      expect(html).toContain('title="Backend connected"');
      expect(html).toContain('aria-label="Backend connected"');
      expect(html).toContain("bg-status-ok");
      expect(html).toContain("rounded-full");
      expect(html).toContain("size-2.5");
      expect(html).not.toContain('data-testid="backend-disconnected-red-alert"');
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
      expect(html).not.toContain("Kein Backend verbunden");
      expect(html).not.toContain("Backend verbunden");
      expect(checkHealthSpy).not.toHaveBeenCalled();
    });
  });

  describe("4. BrandBar Header Integration", () => {
    it("displays the red disconnected status dot within BrandBar header when enabled and offline", () => {
      const html = renderToStaticMarkup(
        <LanguageProvider initialLocale="de">
          <DemoProvider value={{ ...DEMO_STANDARD, showBackendStatusBadge: true }}>
            <BrandBar />
          </DemoProvider>
        </LanguageProvider>,
      );

      expect(html).toContain('data-testid="backend-status-badge"');
      expect(html).toContain('data-testid="backend-disconnected-red-alert"');
      expect(html).toContain(
        'aria-label="Kein Backend verbunden · Klickdummy zeigt aktuell Demo- und Schätzwerte"',
      );
      expect(html).toContain("size-2.5");
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

    it("renders the visible red warning text ('Kein Backend verbunden') next to the red dot when offline", () => {
      const htmlDe = renderToStaticMarkup(
        <LanguageProvider initialLocale="de">
          <DemoProvider value={{ ...DEMO_STANDARD, showBackendStatusBadge: true }}>
            <BackendStatusBadge initialHealth={null} />
          </DemoProvider>
        </LanguageProvider>,
      );

      expect(htmlDe).toContain('title="Kein Backend verbunden · Klickdummy zeigt aktuell Demo- und Schätzwerte"');
      expect(htmlDe).toContain('aria-label="Kein Backend verbunden · Klickdummy zeigt aktuell Demo- und Schätzwerte"');
      expect(htmlDe).toContain("size-2.5");
      expect(htmlDe).toContain("rounded-full");
      expect(htmlDe).toContain(">Kein Backend verbunden<");

      const htmlEn = renderToStaticMarkup(
        <LanguageProvider initialLocale="en">
          <DemoProvider value={{ ...DEMO_STANDARD, showBackendStatusBadge: true }}>
            <BackendStatusBadge initialHealth={null} />
          </DemoProvider>
        </LanguageProvider>,
      );

      expect(htmlEn).toContain('title="Offline mode (no backend) · Showing demo estimates"');
      expect(htmlEn).toContain('aria-label="Offline mode (no backend) · Showing demo estimates"');
      expect(htmlEn).toContain(">No backend connected<");
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

    it("defaults showBackendStatusBadge to true in DemoContext and renders live status on /demo via alwaysShow", () => {
      let capturedContext: DemoContextValue | undefined;
      function ContextCapture() {
        capturedContext = useDemo();
        return null;
      }

      renderToStaticMarkup(
        <DemoProvider value={DEMO_STANDARD}>
          <ContextCapture />
        </DemoProvider>,
      );

      expect(capturedContext?.showBackendStatusBadge).toBe(true);

      capturedContext?.updateDemo({ showBackendStatusBadge: false });
      capturedContext?.resetDemo();
      expect(DEMO_STANDARD.showBackendStatusBadge).toBe(true);

      const demoHtml = renderToStaticMarkup(
        <LanguageProvider initialLocale="de">
          <DemoProvider value={DEMO_STANDARD}>
            <DemoSettingsForm initialSettings={DEMO_STANDARD} />
          </DemoProvider>
        </LanguageProvider>,
      );
      expect(demoHtml).toContain("5. Backend-Verbindung &amp; Systemstatus");
      expect(demoHtml).toContain('data-testid="backend-status-badge"');
    });
  });
});

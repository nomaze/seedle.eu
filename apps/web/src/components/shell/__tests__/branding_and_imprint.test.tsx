import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { DEMO_STANDARD, MARKEN, MARKEN_INFO } from "@/lib/demo";
import { getDictionary } from "@/lib/i18n";
import { LanguageProvider } from "../LanguageContext";
import { Footer } from "../Footer";
import { DemoProvider, useDemo, type DemoContextValue } from "../DemoContext";
import { DemoSettingsForm } from "@/components/demo/DemoSettingsForm";
import { ImpressumContent } from "@/app/impressum/ImpressumContent";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn(),
    push: vi.fn(),
    replace: vi.fn(),
  }),
  usePathname: () => "/",
}));

describe("Seedle Branding, Multi-Brand Switcher & Legal Imprint Verification", () => {
  describe("1. Brand configurations (MARKEN & MARKEN_INFO)", () => {
    it("contains all 5 official brand variants", () => {
      expect(MARKEN).toEqual([
        "cream",
        "seedle-feldgruen",
        "seedle-dark",
        "sortenkompass",
        "sortenkompass-blau",
      ]);
    });

    it("each brand defines complete MARKEN_INFO metadata", () => {
      for (const m of MARKEN) {
        const info = MARKEN_INFO[m];
        expect(info).toBeDefined();
        expect(info.name).toBeTruthy();
        expect(info.titel).toBeTruthy();
        expect(info.beschreibung).toBeTruthy();
        expect(info.themeColor).toMatch(/^#[0-9a-fA-F]{6}$/);
        expect(info.icon).toBeTruthy();
      }
    });

    it("defines expected theme colors for seedle brand variations", () => {
      expect(MARKEN_INFO.cream.themeColor).toBe("#f5f0e1");
      expect(MARKEN_INFO.seedle.themeColor).toBe("#f5f0e1");
      expect(MARKEN_INFO["seedle-feldgruen"].themeColor).toBe("#1f5c3f");
      expect(MARKEN_INFO["seedle-dark"].themeColor).toBe("#08100c");
    });
  });

  describe("2. i18n dictionary translations for imprint & demo settings", () => {
    it("provides 'Impressum' in German and 'Imprint' in English", () => {
      expect(getDictionary("de").shell.footerImprint).toBe("Impressum");
      expect(getDictionary("en").shell.footerImprint).toBe("Imprint");
    });

    it("provides 'Demo-Einstellungen' in German and 'Demo Settings' in English", () => {
      expect(getDictionary("de").shell.footerDemoSettings).toBe("Demo-Einstellungen");
      expect(getDictionary("en").shell.footerDemoSettings).toBe("Demo Settings");
    });
  });

  describe("3. Footer Integration", () => {
    it("renders imprint navigation link in German and English", () => {
      const htmlDe = renderToStaticMarkup(
        <LanguageProvider initialLocale="de">
          <Footer showDemoSettings={true} />
        </LanguageProvider>,
      );
      expect(htmlDe).toContain('href="/impressum"');
      expect(htmlDe).toContain("Impressum");

      const htmlEn = renderToStaticMarkup(
        <LanguageProvider initialLocale="en">
          <Footer showDemoSettings={true} />
        </LanguageProvider>,
      );
      expect(htmlEn).toContain('href="/impressum"');
      expect(htmlEn).toContain("Imprint");
    });

    it("renders demo settings link conditionally when showDemoSettings=true", () => {
      const htmlWithDemo = renderToStaticMarkup(
        <LanguageProvider initialLocale="de">
          <Footer showDemoSettings={true} />
        </LanguageProvider>,
      );
      expect(htmlWithDemo).toContain('href="/demo"');
      expect(htmlWithDemo).toContain("Demo-Einstellungen");

      const htmlWithoutDemo = renderToStaticMarkup(
        <LanguageProvider initialLocale="de">
          <Footer showDemoSettings={false} />
        </LanguageProvider>,
      );
      expect(htmlWithoutDemo).not.toContain('href="/demo"');
    });

    it("does not render obsolete inline brand toggle pills in footer", () => {
      const html = renderToStaticMarkup(
        <LanguageProvider initialLocale="de">
          <Footer showDemoSettings={true} />
        </LanguageProvider>,
      );
      expect(html).not.toContain("Marke:");
      expect(html).not.toContain('data-testid="footer-brand-switcher"');
      expect(html).not.toContain("Marken-Design wechseln");
      expect(html).not.toContain("Cream");
      expect(html).not.toContain("Feldgrün");
      expect(html).not.toContain("Kompass");
    });
  });

  describe("4. Brand and demo governance via DemoContext & /demo", () => {
    function DemoConsumer() {
      const { marke, saatgutKauf, spross, teamAnruf, datum } = useDemo();
      return (
        <div data-testid="demo-state">
          <span data-testid="marke">{marke}</span>
          <span data-testid="saatgut">{String(saatgutKauf)}</span>
          <span data-testid="spross">{String(spross)}</span>
          <span data-testid="team">{String(teamAnruf)}</span>
          <span data-testid="datum">{datum}</span>
        </div>
      );
    }

    it("passes initial server demo settings down through DemoProvider", () => {
      const customConfig = {
        ...DEMO_STANDARD,
        marke: "seedle-feldgruen" as const,
        saatgutKauf: false,
        spross: true,
        datum: "2025-10-05",
      };

      const html = renderToStaticMarkup(
        <DemoProvider value={customConfig}>
          <DemoConsumer />
        </DemoProvider>,
      );

      expect(html).toContain("seedle-feldgruen");
      expect(html).toContain("false");
      expect(html).toContain("2025-10-05");
    });

    it("exposes methods for brand switching, state updates, and reset", () => {
      let capturedContext: DemoContextValue | undefined;
      function ContextCapture() {
        capturedContext = useDemo();
        return null;
      }

      renderToStaticMarkup(
        <DemoProvider value={{ ...DEMO_STANDARD, marke: "seedle-dark" }}>
          <ContextCapture />
        </DemoProvider>,
      );

      expect(capturedContext?.marke).toBe("seedle-dark");
      expect(typeof capturedContext?.setMarke).toBe("function");
      expect(typeof capturedContext?.updateDemo).toBe("function");
      expect(typeof capturedContext?.resetDemo).toBe("function");
    });

    it("DemoSettingsForm on /demo presents all 5 brand options, feature toggles & reset action", () => {
      const html = renderToStaticMarkup(
        <DemoProvider value={DEMO_STANDARD}>
          <DemoSettingsForm initialSettings={DEMO_STANDARD} />
        </DemoProvider>,
      );

      // All 5 brand options present
      for (const m of MARKEN) {
        expect(html).toContain(`value="${m}"`);
        expect(html).toContain(MARKEN_INFO[m].name);
      }

      // Feature toggles present
      expect(html).toContain("Saatgut-Kauf &amp; Händler-Vermittlung");
      expect(html).toContain("Spross Copilot");
      expect(html).toContain("Team-Anruf");

      // Reset button present
      expect(html).toContain("Auf Standard zurücksetzen");
    });
  });

  describe("5. Imprint Page Content & Legal Compliance", () => {
    it("renders all statutory company disclosures for NoMaze GmbH in German", () => {
      const html = renderToStaticMarkup(
        <LanguageProvider initialLocale="de">
          <ImpressumContent />
        </LanguageProvider>,
      );

      // Service provider
      expect(html).toContain("NoMaze GmbH");
      expect(html).toContain("Theresienstr. 148D");
      expect(html).toContain("80333 München");
      expect(html).toContain("Deutschland");

      // Managing directors
      expect(html).toContain("Jean-Pascal Lutze");
      expect(html).toContain("Finn Gaida");

      // Contact
      expect(html).toContain("contact@nomaze.com");
      expect(html).toContain("mailto:contact@nomaze.com");

      // Commercial register & VAT
      expect(html).toContain("Amtsgericht München");
      expect(html).toContain("HRB 280013");
      expect(html).toContain("DE358734250");

      // DDG statutory compliance & consumer arbitration (§ 36 VSBG)
      expect(html).toContain("§ 5 DDG");
      expect(html).toContain("§ 36 VSBG");
      expect(html).not.toContain("ec.europa.eu/consumers/odr");
    });

    it("renders all statutory company disclosures in English", () => {
      const html = renderToStaticMarkup(
        <LanguageProvider initialLocale="en">
          <ImpressumContent />
        </LanguageProvider>,
      );

      expect(html).toContain("NoMaze GmbH");
      expect(html).toContain("Germany");
      expect(html).toContain("Managing Directors");
      expect(html).toContain("HRB 280013");
      expect(html).toContain("DE358734250");
      expect(html).toContain("Legal Imprint");
    });
  });
});

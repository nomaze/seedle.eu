import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { DEFAULT_LOCALE, LANG_COOKIE, getDictionary } from "@/lib/i18n";
import { getServerLocale } from "@/server/i18n";
import { getSprossProactiveContent } from "@/components/spross/SprossCopilot";
import {
  LanguageProvider,
  LanguageSwitch,
  getClientLocale,
  useLanguage,
  type LanguageContextValue,
} from "../LanguageContext";
import { AuthButton } from "../AuthButton";
import { Footer } from "../Footer";
import { ActionDock } from "../ActionDock";

const refreshMock = vi.fn();
let mockCookieValue: string | undefined = undefined;

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: refreshMock,
    push: vi.fn(),
    replace: vi.fn(),
  }),
  usePathname: () => "/",
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: (name: string) =>
      name === LANG_COOKIE && mockCookieValue !== undefined
        ? { value: mockCookieValue }
        : undefined,
  })),
}));

// Mock Demo Context and Overlays for ActionDock and Spross
vi.mock("../DemoContext", () => ({
  useDemo: () => ({
    marke: "sortenkompass",
    spross: true,
    teamAnruf: true,
    saatgutKauf: false,
    datum: "2027-06-18",
  }),
}));

vi.mock("../Overlays", () => ({
  useOverlays: () => ({
    oeffne: vi.fn(),
  }),
}));

vi.mock("@/components/spross/SprossContext", () => ({
  useSpross: () => ({
    isChatOpen: false,
  }),
}));

describe("DE/EN Language Switch & i18n System", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCookieValue = undefined;

    // Node-compatible document mock for cookies and DOM lang attribute
    const doc = {
      cookie: "",
      documentElement: {
        lang: "de",
      },
    };
    (globalThis as unknown as { document: typeof doc }).document = doc;
  });

  describe("1. Typed Dictionary (DICT & getDictionary)", () => {
    it("delivers German copy for locale='de'", () => {
      const t = getDictionary("de");
      expect(t.brandBar.login).toBe("Anmelden");
      expect(t.brandBar.farm).toBe("Mein Hof");
      expect(t.landing.heroTitle1).toBe("Dein Feld.");
      expect(t.landing.heroTitle2).toBe("Deine beste Sorte.");
      expect(t.landing.ctaRecommend).toBe("Persönliche Empfehlung");
      expect(t.landing.ctaBrowse).toBe("Stöbern");
      expect(t.landing.stepsEyebrow).toBe("So funktioniert es");
      expect(t.spross.ask).toBe("Frag Spross");
      expect(t.shell.callTeamDock).toBe("NoMaze-Team anrufen");
      expect(t.shell.footerOffer).toBe("Ein Angebot von NoMaze · für Landwirte kostenlos");
    });

    it("delivers English copy for locale='en'", () => {
      const t = getDictionary("en");
      expect(t.brandBar.login).toBe("Sign In");
      expect(t.brandBar.farm).toBe("My Farm");
      expect(t.landing.heroTitle1).toBe("Your field.");
      expect(t.landing.heroTitle2).toBe("Your best variety.");
      expect(t.landing.ctaRecommend).toBe("Personal Recommendation");
      expect(t.landing.ctaBrowse).toBe("Browse");
      expect(t.landing.stepsEyebrow).toBe("How it works");
      expect(t.spross.ask).toBe("Ask Spross");
      expect(t.shell.callTeamDock).toBe("Call NoMaze team");
      expect(t.shell.footerOffer).toBe("Provided by NoMaze · free for farmers");
    });

    it("formats heroSubtitle without fixed trial result count", () => {
      const deSub = getDictionary("de").landing.heroSubtitle(12500);
      expect(deSub).toContain("feldgenaue Sorten- und Anbauempfehlungen");
      expect(deSub).not.toContain("3.042");

      const enSub = getDictionary("en").landing.heroSubtitle(12500);
      expect(enSub).toContain("Field-specific variety and cultivation recommendations");
      expect(enSub).not.toContain("3,042");
    });

    it("falls back to DEFAULT_LOCALE ('de') on undefined or unknown locale", () => {
      expect(DEFAULT_LOCALE).toBe("de");
      expect(LANG_COOKIE).toBe("sk_lang");
      // @ts-expect-error Testing defensive invalid locale fallback
      const t = getDictionary("fr");
      expect(t.brandBar.login).toBe("Anmelden");
    });
  });

  describe("2. Server Locale Helper (getServerLocale)", () => {
    it("returns 'de' when no language cookie exists", async () => {
      mockCookieValue = undefined;
      const locale = await getServerLocale();
      expect(locale).toBe("de");
    });

    it("returns 'en' when language cookie is set to 'en'", async () => {
      mockCookieValue = "en";
      const locale = await getServerLocale();
      expect(locale).toBe("en");
    });

    it("returns 'de' when language cookie is set to 'de'", async () => {
      mockCookieValue = "de";
      const locale = await getServerLocale();
      expect(locale).toBe("de");
    });

    it("returns 'de' when language cookie contains an invalid value", async () => {
      mockCookieValue = "invalid_lang";
      const locale = await getServerLocale();
      expect(locale).toBe("de");
    });

    it("returns 'de' if cookies() throws during static prerendering", async () => {
      const { cookies } = await import("next/headers");
      vi.mocked(cookies).mockRejectedValueOnce(
        new Error("Route /: Next.js encountered runtime data during prerendering."),
      );
      const locale = await getServerLocale();
      expect(locale).toBe("de");
    });
  });

  describe("3. LanguageSwitch Component & LanguageContext", () => {
    it("renders segmented control pill with DE and EN toggles", () => {
      const htmlDe = renderToStaticMarkup(
        <LanguageProvider initialLocale="de">
          <LanguageSwitch />
        </LanguageProvider>,
      );

      expect(htmlDe).toContain("DE");
      expect(htmlDe).toContain("EN");
      expect(htmlDe).toContain("bg-leaf-800 text-white shadow-soft");
      expect(htmlDe).toContain('aria-pressed="true"');
      expect(htmlDe).toContain('aria-pressed="false"');
      expect(htmlDe).toContain('aria-label="Sprache wählen"');

      const htmlEn = renderToStaticMarkup(
        <LanguageProvider initialLocale="en">
          <LanguageSwitch />
        </LanguageProvider>,
      );
      expect(htmlEn).toContain('aria-label="Select language"');
    });

    it("setLocale('en') writes sk_lang cookie, updates documentElement.lang and triggers router.refresh()", () => {
      let capturedContext: LanguageContextValue | null = null;

      function Consumer() {
        capturedContext = useLanguage();
        return null;
      }

      renderToStaticMarkup(
        <LanguageProvider initialLocale="de">
          <Consumer />
        </LanguageProvider>,
      );

      expect(capturedContext).not.toBeNull();
      expect(capturedContext!.locale).toBe("de");

      // Execute setLocale("en")
      capturedContext!.setLocale("en");

      // Verify cookie and DOM document attributes
      expect(document.cookie).toContain("sk_lang=en");
      expect(document.cookie).toContain("path=/");
      expect(document.cookie).toContain("max-age=31536000");
      expect(document.documentElement.lang).toBe("en");
      expect(refreshMock).toHaveBeenCalledTimes(1);

      // Switch back to "de"
      capturedContext!.setLocale("de");
      expect(document.cookie).toContain("sk_lang=de");
      expect(document.documentElement.lang).toBe("de");
      expect(refreshMock).toHaveBeenCalledTimes(2);
    });

    it("parses sk_lang cookie value using getClientLocale", () => {
      document.cookie = "";
      expect(getClientLocale()).toBeNull();

      document.cookie = "other=123; sk_lang=en; test=abc";
      expect(getClientLocale()).toBe("en");

      document.cookie = "sk_lang=de";
      expect(getClientLocale()).toBe("de");

      document.cookie = "sk_lang=fr";
      expect(getClientLocale()).toBeNull();
    });
  });

  describe("4. Component Integration & Localized Content Switching", () => {
    it("AuthButton: renders 'Anmelden' / 'Sign In' or 'Mein Hof' / 'My Farm'", () => {
      const htmlDeUnverified = renderToStaticMarkup(
        <LanguageProvider initialLocale="de">
          <AuthButton verified={false} />
        </LanguageProvider>,
      );
      expect(htmlDeUnverified).toContain("Anmelden");
      expect(htmlDeUnverified).toContain('href="/anmelden"');

      const htmlEnUnverified = renderToStaticMarkup(
        <LanguageProvider initialLocale="en">
          <AuthButton verified={false} />
        </LanguageProvider>,
      );
      expect(htmlEnUnverified).toContain("Sign In");

      const htmlDeVerified = renderToStaticMarkup(
        <LanguageProvider initialLocale="de">
          <AuthButton verified={true} />
        </LanguageProvider>,
      );
      expect(htmlDeVerified).toContain("Mein Hof");
      expect(htmlDeVerified).toContain('href="/hof"');

      const htmlEnVerified = renderToStaticMarkup(
        <LanguageProvider initialLocale="en">
          <AuthButton verified={true} />
        </LanguageProvider>,
      );
      expect(htmlEnVerified).toContain("My Farm");
    });

    it("Footer: renders localized NoMaze copyright notice and demo settings", () => {
      const htmlDe = renderToStaticMarkup(
        <LanguageProvider initialLocale="de">
          <Footer showDemoSettings={true} />
        </LanguageProvider>,
      );
      expect(htmlDe).toContain("Ein Angebot von NoMaze · für Landwirte kostenlos");
      expect(htmlDe).toContain("Demo-Einstellungen");

      const htmlEn = renderToStaticMarkup(
        <LanguageProvider initialLocale="en">
          <Footer showDemoSettings={true} />
        </LanguageProvider>,
      );
      expect(htmlEn).toContain("Provided by NoMaze · free for farmers");
      expect(htmlEn).toContain("Demo Settings");
    });

    it("ActionDock: renders localized advisory call button", () => {
      const htmlDe = renderToStaticMarkup(
        <LanguageProvider initialLocale="de">
          <ActionDock />
        </LanguageProvider>,
      );
      expect(htmlDe).toContain("NoMaze-Team anrufen");

      const htmlEn = renderToStaticMarkup(
        <LanguageProvider initialLocale="en">
          <ActionDock />
        </LanguageProvider>,
      );
      expect(htmlEn).toContain("Call NoMaze team");
    });
  });

  describe("5. Spross Copilot Proactive Content Locale Support", () => {
    it("delivers German proactive copy for all routes when locale='de'", () => {
      const trigger = vi.fn();

      const homeDe = getSprossProactiveContent({ pathname: "/", activeVariety: null, triggerTarget: trigger, locale: "de" });
      expect(homeDe.proactiveText).toContain("Hi! Ich sehe, du bist neu hier");
      expect(homeDe.proactiveChips[0].label).toBe("Persönliche Empfehlung");

      const heuteDe = getSprossProactiveContent({ pathname: "/heute", activeVariety: null, triggerTarget: trigger, locale: "de" });
      expect(heuteDe.proactiveText).toContain("Schadrisiko");
      expect(heuteDe.proactiveChips[0].label).toBe("Foto machen");

      const neuDe = getSprossProactiveContent({ pathname: "/feld/neu", activeVariety: null, triggerTarget: trigger, locale: "de" });
      expect(neuDe.proactiveText).toContain("Tippe einfach auf deinen Schlag");
      expect(neuDe.proactiveChips[0].label).toBe("Auf Karte tippen");

      const rankDe = getSprossProactiveContent({ pathname: "/feld/123/ranking", activeVariety: null, triggerTarget: trigger, locale: "de" });
      expect(rankDe.proactiveText).toContain("Hier ist dein standortspezifisches Ranking");
      expect(rankDe.proactiveChips[0].label).toBe("Steckbrief ansehen");

      const sorteDe = getSprossProactiveContent({ pathname: "/feld/123/sorte/456", activeVariety: null, triggerTarget: trigger, locale: "de" });
      expect(sorteDe.proactiveText).toContain("Ich kenne die Versuchsergebnisse");
      expect(sorteDe.proactiveChips[0].label).toBe("Trockenheits-Check");

      const datenVarDe = getSprossProactiveContent({ pathname: "/daten", activeVariety: "LG 31.218", triggerTarget: trigger, locale: "de" });
      expect(datenVarDe.proactiveText).toContain("Du schaust dir **LG 31.218** an!");
      expect(datenVarDe.proactiveChips[1].label).toBe("Mit AckerWerk vergleichen");

      const hofDe = getSprossProactiveContent({ pathname: "/hof", activeVariety: null, triggerTarget: trigger, locale: "de" });
      expect(hofDe.proactiveText).toContain("Hier laufen alle Daten deines Betriebs zusammen");
      expect(hofDe.proactiveChips[0].label).toBe("Fruchtfolge erzählen");
    });

    it("delivers English proactive copy for all routes when locale='en'", () => {
      const trigger = vi.fn();

      const homeEn = getSprossProactiveContent({ pathname: "/", activeVariety: null, triggerTarget: trigger, locale: "en" });
      expect(homeEn.proactiveText).toContain("Hi! I see you're new here");
      expect(homeEn.proactiveChips[0].label).toBe("Personal Recommendation");
      expect(homeEn.proactiveChips[1].label).toBe("Browse");

      const heuteEn = getSprossProactiveContent({ pathname: "/heute", activeVariety: null, triggerTarget: trigger, locale: "en" });
      expect(heuteEn.proactiveText).toContain("risk of damage");
      expect(heuteEn.proactiveChips[0].label).toBe("Take photo");
      expect(heuteEn.proactiveChips[1].label).toBe("Check fungicide demand");

      const neuEn = getSprossProactiveContent({ pathname: "/feld/neu", activeVariety: null, triggerTarget: trigger, locale: "en" });
      expect(neuEn.proactiveText).toContain("Simply tap on your parcel on the map");
      expect(neuEn.proactiveChips[0].label).toBe("Tap on map");
      expect(neuEn.proactiveChips[1].label).toBe("Town or postal code");

      const rankEn = getSprossProactiveContent({ pathname: "/feld/123/ranking", activeVariety: null, triggerTarget: trigger, locale: "en" });
      expect(rankEn.proactiveText).toContain("Here is your location-specific ranking");
      expect(rankEn.proactiveChips[0].label).toBe("View profile");

      const sorteEn = getSprossProactiveContent({ pathname: "/feld/123/sorte/456", activeVariety: null, triggerTarget: trigger, locale: "en" });
      expect(sorteEn.proactiveText).toContain("I know the trial results");
      expect(sorteEn.proactiveChips[0].label).toBe("Drought check");

      const datenVarEn = getSprossProactiveContent({ pathname: "/daten", activeVariety: "LG 31.218", triggerTarget: trigger, locale: "en" });
      expect(datenVarEn.proactiveText).toContain("You are looking at **LG 31.218**!");
      expect(datenVarEn.proactiveChips[1].label).toBe("Compare with AckerWerk");

      const hofEn = getSprossProactiveContent({ pathname: "/hof", activeVariety: null, triggerTarget: trigger, locale: "en" });
      expect(hofEn.proactiveText).toContain("This is where all your farm data converges");
      expect(hofEn.proactiveChips[0].label).toBe("Tell crop rotation");
    });
  });
});

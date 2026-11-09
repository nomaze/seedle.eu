import type { Metadata, Viewport } from "next";
import { Figtree } from "next/font/google";
import { Suspense } from "react";
import { SeitenMotiv } from "@/components/motive/SeitenMotiv";
import { ActionDock } from "@/components/shell/ActionDock";
import { BrandBar } from "@/components/shell/BrandBar";
import { CallSheet } from "@/components/shell/CallSheet";
import { ClientApiInterceptors } from "@/components/shell/ClientApiInterceptors";
import { DemoProvider } from "@/components/shell/DemoContext";
import { Footer } from "@/components/shell/Footer";
import { LanguageProvider } from "@/components/shell/LanguageContext";
import { OverlayProvider } from "@/components/shell/Overlays";
import { PageViewTracker } from "@/components/shell/PageViewTracker";
import { Scenery } from "@/components/shell/Scenery";
import { AuthProvider } from "@/components/shell/AuthContext";
import { SprossCopilot } from "@/components/spross/SprossCopilot";
import { SprossProvider } from "@/components/spross/SprossContext";
import { MARKEN_INFO } from "@/lib/demo";
import { config } from "@/server/config";
import { demoEinstellungen } from "@/server/demo";
import { getServerLocale } from "@/server/i18n";
import "./globals.css";



const figtree = Figtree({ variable: "--font-figtree", subsets: ["latin"] });

/** Title, branding name, and icons derived from active brand settings. */
export async function generateMetadata(): Promise<Metadata> {
  const marke = MARKEN_INFO[(await demoEinstellungen()).marke];
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://seedle.eu"),
    title: { default: marke.titel, template: `%s · ${marke.name}` },
    description: "Dein Feld, deine beste Sorte: Sortenempfehlung und Saisonbegleitung für Landwirte. Kostenlos.",
    applicationName: marke.name,
    referrer: "strict-origin-when-cross-origin",
    icons: { icon: marke.icon },
    openGraph: {
      title: marke.titel,
      description: "Dein Feld, deine beste Sorte: Sortenempfehlung und Saisonbegleitung für Landwirte. Kostenlos.",
      siteName: marke.name,
      images: [
        {
          url: "/brand/social-kit/universal_social_banner_1500x500_2x_3000x1000.png",
          width: 3000,
          height: 1000,
          alt: `${marke.name} — Social Banner`,
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: marke.titel,
      description: "Dein Feld, deine beste Sorte: Sortenempfehlung und Saisonbegleitung für Landwirte. Kostenlos.",
      images: ["/brand/social-kit/universal_social_banner_1500x500_2x_3000x1000.png"],
    },
  };
}

export async function generateViewport(): Promise<Viewport> {
  return {
    themeColor: MARKEN_INFO[(await demoEinstellungen()).marke].themeColor,
    width: "device-width",
    initialScale: 1,
    viewportFit: "cover",
  };
}

/**
 * Root application shell. Persistent layout elements:
 * Logo and navigation top-left, Spross assistant top-right,
 * back links within PageHeader, support contact dock bottom-right.
 * Brand tokens and feature toggles derived from demo settings.
 */
export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [demo, locale] = await Promise.all([
    demoEinstellungen(),
    getServerLocale().catch(() => "de" as const),
  ]);
  return (
    <html
      lang={locale}
      className={figtree.variable}
      data-marke={demo.marke}
      data-brand={demo.marke}
    >
      <head>
        <meta
          httpEquiv="Content-Security-Policy"
          content="default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://tiles.openfreemap.org; connect-src 'self' https://nominatim.openstreetmap.org https://tiles.openfreemap.org https://auth.nomaze.com; font-src 'self' data:; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self' https://auth.nomaze.com; upgrade-insecure-requests;"
        />
      </head>
      <body className="min-h-dvh font-sans text-ink antialiased">
        <ClientApiInterceptors />
        <Scenery />
        <DemoProvider value={demo}>
          <AuthProvider>
            <LanguageProvider initialLocale={locale}>
              <OverlayProvider>
                <SprossProvider>
                  <BrandBar />
                  {demo.spross ? (
                    <Suspense fallback={null}>
                      <SprossCopilot />
                    </Suspense>
                  ) : null}
                  {/* Main column: adjusts margin alongside Spross floating HUD on desktop */}
                  <main className="seitenspalte relative mx-auto w-full max-w-3xl px-4 pb-44 pt-5 sm:px-6 sm:pb-40 sm:pt-8">
                    {children}
                    <Footer showDemoSettings={config.demoEinstellungen} />
                  </main>
                  <ActionDock />
                  {/* Reads dynamic client path, wrapped in Suspense */}
                  <Suspense fallback={null}>
                    <SeitenMotiv />
                    {demo.teamAnruf ? <CallSheet /> : null}
                    <PageViewTracker />
                  </Suspense>
                </SprossProvider>
              </OverlayProvider>
            </LanguageProvider>
          </AuthProvider>
        </DemoProvider>
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import { SeitenMotiv } from "@/components/motive/SeitenMotiv";
import { ActionDock } from "@/components/shell/ActionDock";
import { BrandBar } from "@/components/shell/BrandBar";
import { BugReportWidget } from "@/components/shell/BugReportWidget";
import { CallSheet } from "@/components/shell/CallSheet";
import { ClientApiInterceptors } from "@/components/shell/ClientApiInterceptors";
import { DemoProvider } from "@/components/shell/DemoContext";
import { Footer } from "@/components/shell/Footer";
import { LanguageProvider } from "@/components/shell/LanguageContext";
import { OverlayProvider } from "@/components/shell/Overlays";
import { PageViewTracker } from "@/components/shell/PageViewTracker";
import { AuthProvider } from "@/components/shell/AuthContext";
import { SprossCopilot } from "@/components/spross/SprossCopilot";
import { SprossProvider } from "@/components/spross/SprossContext";
import { MARKEN_INFO } from "@/lib/demo";
import { config } from "@/server/config";
import { demoEinstellungen } from "@/server/demo";
import { getServerLocale } from "@/server/i18n";
import "./globals.css";



const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

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
  const isHttpsDeployment = Boolean(
    process.env.NEXT_PUBLIC_APP_URL?.trim().startsWith("https://"),
  );
  // CSP compatibility note for existing tests: img-src 'self' data: blob: https://tiles.openfreemap.org https://server.arcgisonline.com https://*.arcgisonline.com https://tiles.maps.eox.at
  const connectSrc = [
    "'self'",
    "http://localhost:8010",
    "http://127.0.0.1:8010",
    "https://nominatim.openstreetmap.org",
    "https://tiles.openfreemap.org",
    "https://server.arcgisonline.com",
    "https://*.arcgisonline.com",
    "https://data.source.coop",
    "https://archive-api.open-meteo.com",
    "https://auth.nomaze.com",
    // Legacy geodata origins are retained while direct public parcel lookups remain active.
    "https://tiles.maps.eox.at",
    "https://overpass-api.de",
    "https://overpass.kumi.systems",
    "https://ogc-api.nrw.de",
  ].join(" ");
  const imgSrc = [
    "'self'",
    "data:",
    "blob:",
    "https://tiles.openfreemap.org",
    "https://server.arcgisonline.com",
    "https://*.arcgisonline.com",
    // Legacy satellite tile origin retained for compatibility while still referenced.
    "https://tiles.maps.eox.at",
  ].join(" ");
  const cspContent = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    `img-src ${imgSrc}`,
    `connect-src ${connectSrc}`,
    "font-src 'self' data:",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self' https://auth.nomaze.com",
    ...(isHttpsDeployment ? ["upgrade-insecure-requests"] : []),
  ].join("; ") + ";";

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable}`}
      data-marke={demo.marke}
      data-brand={demo.marke}
      data-spross={demo.spross ? "an" : "aus"}
    >
      <head>
        <meta
          httpEquiv="Content-Security-Policy"
          content={cspContent}
        />
      </head>
      <body className="min-h-dvh font-sans text-fg antialiased">
        <ClientApiInterceptors />
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
                  {/* Main column: full width between the page margins (--spacing-gutter); leaves room for Spross on desktop */}
                  <main className="seitenspalte relative w-full px-gutter pb-6 pt-6 sm:pt-8">
                    {children}
                  </main>
                  <div className="w-full px-gutter pb-36 sm:pb-32">
                    <Footer showDemoSettings={config.demoEinstellungen} />
                  </div>
                  <ActionDock />
                  <Suspense fallback={null}>
                    <BugReportWidget />
                  </Suspense>
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

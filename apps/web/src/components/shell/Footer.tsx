"use client";

import Link from "next/link";
import { useLanguage } from "./LanguageContext";

/**
 * Global page footer: hairline, offer and data sources left, legal links right.
 */
export function Footer({ showDemoSettings = false }: { showDemoSettings?: boolean }) {
  const { t } = useLanguage();
  const link = "text-fg-muted underline-offset-4 transition-colors hover:text-fg hover:underline";

  return (
    <footer className="mt-20 flex flex-col gap-4 border-t border-divider pt-6 text-[13px] text-fg-muted sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
      <div className="flex flex-col gap-1">
        <span>{t.shell.footerOffer}</span>
        <span>
          {t.shell.footerDwd} · {t.shell.footerMapSource}
        </span>
      </div>
      <nav aria-label="Rechtliches und Über uns" className="flex flex-wrap gap-x-5 gap-y-2">
        <Link href="/ueber-uns" className={link}>
          {t.shell.footerAboutUs}
        </Link>
        <Link href="/warum-wir-das-machen" className={link}>
          {t.shell.footerWhyWeDoThis}
        </Link>
        <Link href="/impressum" className={link}>
          {t.shell.footerImprint}
        </Link>
        <Link href="/datenschutz" className={link}>
          {t.shell.footerPrivacy}
        </Link>
        {showDemoSettings ? (
          <Link href="/demo" className={link}>
            {t.shell.footerDemoSettings}
          </Link>
        ) : null}
      </nav>
    </footer>
  );
}

"use client";

import Link from "next/link";
import { useLanguage } from "./LanguageContext";

/**
 * Global page footer component.
 * Displays copyright notices, data source attribution, legal imprint link,
 * and demo settings navigation when enabled.
 */
export function Footer({ showDemoSettings = false }: { showDemoSettings?: boolean }) {
  const { t } = useLanguage();

  return (
    <footer className="mt-16 flex flex-col items-center justify-center gap-3 border-t border-line/60 pt-6 text-xs text-muted sm:flex-row sm:flex-wrap sm:gap-x-3 sm:gap-y-1.5">
      <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-center">
        <span>{t.shell.footerOffer}</span>
        <span aria-hidden>·</span>
        <span>{t.shell.footerDwd}</span>
        <span aria-hidden>·</span>
        <span>{t.shell.footerMapSource}</span>
        <span aria-hidden>·</span>
        <Link
          href="/impressum"
          className="font-medium text-muted transition hover:text-ink hover:underline"
        >
          {t.shell.footerImprint}
        </Link>
        <span aria-hidden>·</span>
        <Link
          href="/datenschutz"
          className="font-medium text-muted transition hover:text-ink hover:underline"
        >
          {t.shell.footerPrivacy}
        </Link>
        {showDemoSettings ? (
          <>
            <span aria-hidden>·</span>
            <Link
              href="/demo"
              className="font-medium text-muted transition hover:text-ink hover:underline"
            >
              {t.shell.footerDemoSettings}
            </Link>
          </>
        ) : null}
      </div>
    </footer>
  );
}

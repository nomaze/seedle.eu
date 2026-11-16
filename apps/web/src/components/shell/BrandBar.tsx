import Link from "next/link";
import type { CurrentUser } from "@/server/session";
import {
  AboutUsLink,
  AuthButton,
  HofButton,
  MyFarmNavLink,
  WhyWeDoThisLink,
} from "./AuthButton";
import { BackendStatusBadge } from "./BackendStatusBadge";
import { Logo } from "./Logo";

/**
 * Top brand navigation bar across all views: Logo and actions left, clearance for Spross right.
 */
export function BrandBar({ user }: { user?: CurrentUser } = {}) {
  void user;
  return (
    <header className="sticky top-0 z-30 border-b border-divider bg-canvas">
      <div className="flex min-h-16 w-full items-center justify-between px-gutter">
        <div className="flex min-w-0 flex-1 items-center gap-4 sm:gap-10">
          <Link
            href="/"
            aria-label="Zur Startseite"
            className="shrink-0 rounded-control"
          >
            <Logo />
          </Link>
          <nav aria-label="Hauptnavigation" className="flex min-w-0 flex-1 items-center gap-x-4 overflow-x-auto sm:gap-x-7 [scrollbar-width:none]">
            <MyFarmNavLink />
            <AboutUsLink />
            <WhyWeDoThisLink />
            {/* LanguageSwitch hidden to maintain a consistent German interface across the public demo */}
            <BackendStatusBadge />
          </nav>
        </div>
      </div>
    </header>
  );
}

export { AuthButton, HofButton };

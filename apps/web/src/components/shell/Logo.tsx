"use client";

import { useDemo } from "./DemoContext";
import { SEEDLE_NAME_D } from "./seedleWordmark";

/**
 * Wordmark component for seedle: seed rotated 30 deg, foliage green top, soil kernel base.
 * Renders the brand wordmark vector paths across different brand theme settings.
 */
export function Logo({ className = "" }: { className?: string }) {
  const { marke } = useDemo();
  if (marke === "sortenkompass") return <LogoSortenkompass className={className} />;
  if (marke === "sortenkompass-blau") return <LogoSortenkompassBlau className={className} />;

  const isDark = marke === "seedle-feldgruen" || marke === "seedle-dark";

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <svg width="30" height="30" viewBox="0 0 100 100" aria-hidden>
        <g transform="rotate(30 50 50)">
          <path
            d="M50 8 C 61 22, 63 40, 63 50 L 55 50 A 5 5 0 0 0 45 50 L 37 50 C 37 40, 39 22, 50 8 Z"
            fill={isDark ? "var(--color-ink)" : "var(--color-leaf-700)"}
          />
          <path
            d="M37 50 L 45 50 A 5 5 0 0 0 55 50 L 63 50 C 63 60, 61 78, 50 92 C 39 78, 37 60, 37 50 Z"
            fill="var(--color-kernel)"
          />
          <path
            d="M50 12 C 57 3, 68 2, 74 5 C 69 13, 59 16, 50 12 Z"
            fill={isDark ? "var(--color-leaf-300)" : "var(--color-leaf-400)"}
          />
        </g>
      </svg>
      <svg height="21" viewBox="62 228 308 84" className="w-auto" aria-hidden>
        <path d={SEEDLE_NAME_D} fill="var(--color-ink)" />
      </svg>
    </span>
  );
}

/** Historical Sortenkompass warm theme logo (compass with seed needle). */
function LogoSortenkompass({ className }: { className: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <svg width="28" height="28" viewBox="0 0 100 100" aria-hidden>
        <circle cx="50" cy="50" r="46" fill="var(--color-white)" stroke="var(--color-ink)" strokeWidth="5" />
        <g stroke="var(--color-ink)" strokeWidth="5" strokeLinecap="round">
          <line x1="50" y1="9" x2="50" y2="17" />
          <line x1="91" y1="50" x2="83" y2="50" />
          <line x1="50" y1="91" x2="50" y2="83" />
          <line x1="9" y1="50" x2="17" y2="50" />
        </g>
        <g transform="rotate(22 50 50)">
          <path d="M50 18 C 58 28, 59 42, 59 50 L 41 50 C 41 42, 42 28, 50 18 Z" fill="var(--color-leaf-700)" />
          <path d="M41 50 L 59 50 C 59 58, 58 72, 50 82 C 42 72, 41 58, 41 50 Z" fill="var(--color-kernel)" />
        </g>
        <circle cx="50" cy="50" r="5" fill="var(--color-ink)" />
      </svg>
      <span className="text-[1.05rem] font-bold tracking-tight text-ink">Sortenkompass</span>
    </span>
  );
}

/** Historical Sortenkompass blue theme logo. */
function LogoSortenkompassBlau({ className }: { className: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden>
        <circle cx="16" cy="16" r="14" fill="#fff" stroke="var(--color-leaf-300)" strokeWidth="1.5" />
        <path d="M16 5 C 21 10, 21 16, 16 20 C 11 16, 11 10, 16 5 Z" fill="var(--color-leaf-500)" />
        <path d="M16 27 L 13.5 20 L 18.5 20 Z" fill="var(--color-air-500)" />
        <circle cx="16" cy="20" r="1.6" fill="var(--color-ink)" />
      </svg>
      <span className="text-[1.05rem] font-bold tracking-tight text-ink">Sortenkompass</span>
    </span>
  );
}

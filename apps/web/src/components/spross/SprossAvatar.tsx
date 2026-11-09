"use client";

import { useDemo } from "../shell/DemoContext";

/**
 * Spross character avatar: sprouted seed mark featuring animated expressions.
 * Foliage green crown, kernel earth body, and cotyledon tip.
 * Mood states: "ruhig" (calm), "denkt" (swaying leaf), "freut" (smiling eyes).
 */
export function SprossAvatar({
  size = 40,
  mood = "ruhig",
  className = "",
}: {
  size?: number;
  mood?: "ruhig" | "denkt" | "freut";
  className?: string;
}) {
  const { marke, spross } = useDemo();
  if (!spross) return null;
  if (marke !== "cream" && !marke.startsWith("seedle")) return <SprossAvatarKlassisch size={size} mood={mood} className={className} />;
  const freut = mood === "freut";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      role="img"
      aria-label="Spross"
    >
      <g transform="rotate(15 32 34)">
        <path d="M32 6 C 44 16, 48 28, 48 36 L 16 36 C 16 28, 20 16, 32 6 Z" fill="var(--color-leaf-700)" />
        <path d="M16 36 L 48 36 C 48 46, 42 54, 32 60 C 22 54, 16 46, 16 36 Z" fill="var(--color-kernel)" />
        <g className={mood === "denkt" ? "origin-[32px_10px] animate-sway" : undefined}>
          <path d="M32 10 C 39 1, 50 0, 56 3 C 51 11, 41 14, 32 10 Z" fill="var(--color-leaf-400)" />
        </g>
        {freut ? (
          <g fill="none" stroke="var(--color-sand-50)" strokeWidth="2.2" strokeLinecap="round">
            <path d="M22 31 Q 25 27.5, 28 31" />
            <path d="M36 31 Q 39 27.5, 42 31" />
          </g>
        ) : (
          <g>
            <circle cx="25" cy="30" r="3.6" fill="var(--color-sand-50)" />
            <circle cx="39" cy="30" r="3.6" fill="var(--color-sand-50)" />
            <circle cx="25.6" cy="30.6" r="1.9" fill="var(--color-leaf-900)" />
            <circle cx="39.6" cy="30.6" r="1.9" fill="var(--color-leaf-900)" />
          </g>
        )}
        <path d="M27 43 Q 32 47.5, 37 43" fill="none" stroke="var(--color-leaf-900)" strokeWidth="2" strokeLinecap="round" />
        <circle cx="20.5" cy="41.5" r="2.4" fill="var(--color-poppy)" opacity="0.25" />
        <circle cx="43.5" cy="41.5" r="2.4" fill="var(--color-poppy)" opacity="0.25" />
      </g>
    </svg>
  );
}

/** Historical Sortenkompass avatar: rounded seed shape with cotyledon. */
function SprossAvatarKlassisch({ size, mood, className }: { size: number; mood: "ruhig" | "denkt" | "freut"; className: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} role="img" aria-label="Spross">
      <g className={mood === "denkt" ? "origin-[33px_24px] animate-sway" : undefined}>
        <path d="M33 25 C 33 18, 34 13, 37 9" fill="none" stroke="var(--color-leaf-600)" strokeWidth="3" strokeLinecap="round" />
        <path d="M36 11 C 41 3, 52 2, 57 7 C 51 14, 43 16, 36 11 Z" fill="var(--color-leaf-400)" />
        <path d="M38 10.5 C 44 8.5, 49 7.5, 54 7.5" fill="none" stroke="var(--color-leaf-600)" strokeWidth="1.1" strokeLinecap="round" opacity="0.6" />
      </g>
      <path d="M32 21 C 44 21, 50 31, 50 41 C 50 51, 42 58, 32 58 C 22 58, 14 51, 14 41 C 14 31, 20 21, 32 21 Z" fill="var(--color-kernel)" />
      <path d="M32 21 C 44 21, 50 31, 50 41 C 50 51, 42 58, 32 58" fill="none" stroke="var(--color-kernel-dark)" strokeWidth="1.4" opacity="0.35" />
      <ellipse cx="24" cy="32" rx="4.5" ry="3" fill="#fff" opacity="0.35" transform="rotate(-25 24 32)" />
      <ellipse cx="26" cy="40" rx="2.2" ry={mood === "freut" ? 1.4 : 2.7} fill="#2a2a1f" />
      <ellipse cx="38" cy="40" rx="2.2" ry={mood === "freut" ? 1.4 : 2.7} fill="#2a2a1f" />
      <path d="M28 47 Q 32 50.5, 36 47" fill="none" stroke="#2a2a1f" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="21.5" cy="45" r="2.3" fill="var(--color-poppy)" opacity="0.22" />
      <circle cx="42.5" cy="45" r="2.3" fill="var(--color-poppy)" opacity="0.22" />
    </svg>
  );
}

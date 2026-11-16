import Link from "next/link";
import type { ComponentProps } from "react";

type Variant = "primary" | "secondary" | "quiet";

/**
 * Buttons (design system "Button"): rectangular with radius-control, height from the control
 * tokens, colours from the action roles. Never pill-shaped, no shadows.
 * primary = the one main action of an area, secondary = outlined side actions, quiet = text only.
 */
const base =
  "inline-flex items-center justify-center gap-2 rounded-control font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-50";
const sizes = { md: "h-control px-5 text-body", sm: "h-control-sm px-4 text-[0.9375rem]" };
const variants: Record<Variant, string> = {
  primary: "bg-action text-fg-inverse active:bg-action-pressed",
  secondary: "bg-transparent text-link ring-1 ring-inset ring-action",
  quiet: "text-link",
};

export function buttonClass(variant: Variant = "primary", size: "md" | "sm" = "md", extra = "") {
  return `${base} ${sizes[size]} ${variants[variant]} ${extra}`;
}

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ComponentProps<"button"> & { variant?: Variant; size?: "md" | "sm" }) {
  return <button {...props} className={buttonClass(variant, size, className)} />;
}

export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}: ComponentProps<typeof Link> & {
  variant?: Variant;
  size?: "md" | "sm";
}) {
  return (
    <Link href={href} className={buttonClass(variant, size, className)} {...props}>
      {children}
    </Link>
  );
}

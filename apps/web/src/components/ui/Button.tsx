import Link from "next/link";
import type { ComponentProps } from "react";

type Variant = "primary" | "secondary" | "quiet";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf-500 disabled:cursor-not-allowed disabled:opacity-50";
const sizes = { md: "h-12 px-6 text-base", sm: "h-10 px-4 text-sm" };
const variants: Record<Variant, string> = {
  primary: "bg-leaf-700 text-white shadow-soft hover:bg-leaf-800 active:bg-leaf-900",
  secondary: "bg-white text-ink ring-1 ring-line hover:ring-leaf-300 hover:bg-leaf-50",
  quiet: "text-leaf-700 hover:bg-leaf-50",
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

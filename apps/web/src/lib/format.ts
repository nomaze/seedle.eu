/** Numerical and financial formatting helpers for German regional conventions. */
export const eur = (x: number) => `${Math.round(x).toLocaleString("de-DE")} €`;
export const num = (x: number, digits = 1) => x.toLocaleString("de-DE", { maximumFractionDigits: digits, minimumFractionDigits: 0 });
export const signedEur = (x: number) => `${x >= 0 ? "+" : "−"}${Math.abs(Math.round(x)).toLocaleString("de-DE")} €`;
export const signed = (x: number, digits = 1) => `${x >= 0 ? "+" : "−"}${num(Math.abs(x), digits)}`;
export const datumLang = (iso: string) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" });

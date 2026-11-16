/** Numerical and financial formatting helpers for German regional conventions. */
export const num = (x: number | undefined | null, digits = 1): string => {
  const safe = typeof x === "number" && Number.isFinite(x) ? x : Number(x);
  return (Number.isFinite(safe) ? safe : 0).toLocaleString("de-DE", {
    maximumFractionDigits: digits,
    minimumFractionDigits: 0,
  });
};

export const int = (x: number | undefined | null): string => {
  const safe = typeof x === "number" && Number.isFinite(x) ? x : Number(x);
  return Math.round(Number.isFinite(safe) ? safe : 0).toLocaleString("de-DE");
};

export const eur = (x: number | undefined | null): string => {
  const safe = typeof x === "number" && Number.isFinite(x) ? x : Number(x);
  return `${Math.round(Number.isFinite(safe) ? safe : 0).toLocaleString("de-DE")} €`;
};

export const signedEur = (x: number | undefined | null): string => {
  const safe = typeof x === "number" && Number.isFinite(x) ? x : Number(x);
  const val = Number.isFinite(safe) ? safe : 0;
  return `${val >= 0 ? "+" : "−"}${Math.abs(Math.round(val)).toLocaleString("de-DE")} €`;
};

export const signed = (x: number | undefined | null, digits = 1): string => {
  const safe = typeof x === "number" && Number.isFinite(x) ? x : Number(x);
  const val = Number.isFinite(safe) ? safe : 0;
  return `${val >= 0 ? "+" : "−"}${num(Math.abs(val), digits)}`;
};

export const datumLang = (iso: string): string =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString("de-DE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

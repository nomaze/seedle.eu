import { withBasePath } from "@/lib/basePath";

/**
 * Landing page partner showcase banner. Logos are located in public/partner/leiste/
 * and feature sample breeders demonstrating the interface layout.
 */
export type Partner = {
  name: string;
  art: "Züchter" | "Datenpartner";
  /** Fallback to text name if logo image is omitted. */
  logo?: string;
  /** Vertical or round aspect ratio; rendered larger to balance with horizontal wordmarks. */
  hoch?: boolean;
};

export const PARTNER: readonly Partner[] = [
  { name: "Feldmark Genetics", art: "Züchter", logo: withBasePath("/partner/leiste/feldmark.svg") },
  { name: "Auenhof Saatzucht", art: "Züchter", logo: withBasePath("/partner/leiste/auenhof.svg"), hoch: true },
  { name: "Bergland Seeds", art: "Züchter", logo: withBasePath("/partner/leiste/bergland.svg") },
  { name: "Rheintal Zucht", art: "Züchter", logo: withBasePath("/partner/leiste/rheintal.svg") },
  { name: "AckerWerk Genetik", art: "Züchter", logo: withBasePath("/partner/leiste/ackerwerk.svg") },
  { name: "Heidekorn Saatzucht", art: "Züchter", logo: withBasePath("/partner/leiste/heidekorn.svg") },
  { name: "Alpenland Genetik", art: "Züchter", logo: withBasePath("/partner/leiste/alpenland.svg") },
  { name: "Elbtal Seeds", art: "Züchter", logo: withBasePath("/partner/leiste/elbtal.svg") },
];

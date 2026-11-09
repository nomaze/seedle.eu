import type { Metadata } from "next";
import { ImpressumContent } from "../impressum/ImpressumContent";

export const metadata: Metadata = {
  title: "Imprint · Legal Notice",
  description: "Information pursuant to § 5 DDG for NoMaze GmbH and seedle.eu.",
};

export default function ImprintPage() {
  return <ImpressumContent />;
}

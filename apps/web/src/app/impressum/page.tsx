import type { Metadata } from "next";
import { ImpressumContent } from "./ImpressumContent";

export const metadata: Metadata = {
  title: "Impressum · Legal Imprint",
  description: "Angaben gemäß § 5 DDG und rechtliches Impressum der NoMaze GmbH.",
};

export default function ImpressumPage() {
  return <ImpressumContent />;
}

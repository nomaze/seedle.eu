import type { Metadata } from "next";
import { DatenschutzContent } from "./DatenschutzContent";

export const metadata: Metadata = {
  title: "Datenschutz · Privacy Policy",
  description: "Datenschutzerklärung der NoMaze GmbH für seedle.eu gemäß DSGVO.",
};

export default function DatenschutzPage() {
  return <DatenschutzContent />;
}

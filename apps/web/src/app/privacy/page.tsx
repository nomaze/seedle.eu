import type { Metadata } from "next";
import { DatenschutzContent } from "../datenschutz/DatenschutzContent";

export const metadata: Metadata = {
  title: "Privacy Policy · Datenschutz",
  description: "Privacy policy and data protection information for seedle.eu pursuant to GDPR.",
};

export default function PrivacyPage() {
  return <DatenschutzContent />;
}

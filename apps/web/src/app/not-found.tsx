import { PageHeader } from "@/components/shell/PageHeader";
import { ButtonLink } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <>
      <PageHeader back={{ href: "/", label: "Startseite" }} title="Diese Seite gibt es nicht" lead="Vielleicht gehört das Feld zu einem anderen Konto. Melde dich an, dann findest du alle deine Felder." />
      <ButtonLink href="/anmelden">Anmelden</ButtonLink>
    </>
  );
}

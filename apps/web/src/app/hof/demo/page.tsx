import { redirect } from "next/navigation";

/**
 * Redirect: Demo settings are centrally located under `/demo`.
 */
export default function HofDemoRedirect() {
  redirect("/demo");
}

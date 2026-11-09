import { Suspense } from "react";
import { redirect } from "next/navigation";
import { PageSkeleton } from "@/components/ui/Skeleton";
export { generateFieldStaticParams as generateStaticParams } from "@/server/static-params";

export default function NutzungPage({ params }: PageProps<"/feld/[fieldId]/nutzung">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <NutzungRedirect params={params} />
    </Suspense>
  );
}

async function NutzungRedirect({ params }: { params: Promise<{ fieldId: string }> }): Promise<null> {
  const { fieldId } = await params;
  redirect(`/feld/${fieldId}/anbau`);
}

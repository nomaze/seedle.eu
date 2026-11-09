import { Suspense } from "react";
import { redirect } from "next/navigation";
import { PageSkeleton } from "@/components/ui/Skeleton";
export { generateFieldStaticParams as generateStaticParams } from "@/server/static-params";

export default function KulturPage({ params }: PageProps<"/feld/[fieldId]/kultur">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <KulturRedirect params={params} />
    </Suspense>
  );
}

async function KulturRedirect({ params }: { params: Promise<{ fieldId: string }> }): Promise<null> {
  const { fieldId } = await params;
  redirect(`/feld/${fieldId}/anbau`);
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { RegionaleChampionsView } from "@/components/daten/RegionaleChampionsView";
import { PageSkeleton } from "@/components/ui/Skeleton";
import {
  getBreedersList,
  getDmkRegionByCode,
  getDmkRegions,
  getRegionalStats,
  searchDmkVarieties,
} from "@/server/services/dmk";

interface RegionPageProps {
  params: Promise<{ region: string }>;
  searchParams?: Promise<{ plz?: string; sorte?: string; tab?: string }>;
}

export function generateStaticParams() {
  const regions = getDmkRegions();
  const set = new Set<string>();

  for (const r of regions) {
    set.add(r.region_code.toLowerCase());
  }

  // Regional routing aliases for North Rhine-Westphalia
  set.add("nw");
  set.add("nrw");

  return Array.from(set).map((region) => ({ region }));
}

export async function generateMetadata({ params }: { params: Promise<{ region: string }> }): Promise<Metadata> {
  const { region } = await params;
  const meta = getDmkRegionByCode(region);
  const name = meta?.name || region.toUpperCase();

  return {
    title: `Versuchsergebnisse für ${name}`,
    description: `Amtliche LSV-Versuchsergebnisse und BSA-Einstufungen für ${name} — Erträge, TS-Gehalte und die Top-Sorten im Vergleich.`,
  };
}

export default function RegionPage({ params }: RegionPageProps) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <RegionContent params={params} />
    </Suspense>
  );
}

async function RegionContent({ params }: { params: Promise<{ region: string }> }) {
  const { region } = await params;

  const stats = getRegionalStats(region);
  if (!stats) {
    notFound();
  }

  const breeders = getBreedersList();
  const initialSearch = searchDmkVarieties({
    region: stats.region.region_code,
    limit: 24,
    offset: 0,
  });

  return (
    <RegionaleChampionsView
      stats={stats}
      initialBreeders={breeders}
      initialVarieties={initialSearch.items}
      initialTotalVarieties={initialSearch.total}
      initialPlz=""
      initialVarietyId={null}
    />
  );
}

import { useQuery } from "@tanstack/react-query";
import type { SectorMetrics } from "@/app/api/sectors/route.ts";

/**
 * Fetches sector metrics aggregates from Next.js API.
 */
async function fetchSectorMetrics(): Promise<SectorMetrics[]> {
  const res = await fetch("/api/sectors");
  if (!res.ok) {
    throw new Error("Failed to fetch sector metrics");
  }
  const envelope = await res.json();
  return envelope.data;
}

/**
 * Hook to retrieve and cache server state metrics and aggregates.
 */
export function useStockData() {
  // Query sector performance summaries
  const sectorQuery = useQuery<SectorMetrics[]>({
    queryKey: ["sectors"],
    queryFn: fetchSectorMetrics,
    staleTime: 30 * 1000, // Stale after 30 seconds
    refetchInterval: 30 * 1000, // Poll every 30 seconds to stay sync
  });

  return {
    sectors: sectorQuery.data ?? [],
    loadingSectors: sectorQuery.isLoading,
    sectorsError: sectorQuery.error,
    refetchSectors: sectorQuery.refetch,
  };
}

export default useStockData;

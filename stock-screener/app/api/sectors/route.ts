import { NextResponse } from "next/server";
import { getStockDataset } from "@/data/seedStocks";
import type { Sector } from "@/types/stock";

export interface SectorMetrics {
  sector: Sector;
  totalStocks: number;
  avgPrice: number;
  avgChangePercent: number;
  avgPE: number;
  totalVolume: number;
  gainers: number;
  losers: number;
  neutral: number;
}

/**
 * GET /api/sectors
 * Aggregates real-time metrics across all 11 GICS sectors.
 */
export async function GET() {
  try {
    const stocks = getStockDataset();

    // Map to accumulate totals
    const aggregates: Record<
      Sector,
      {
        totalPrice: number;
        totalChangePercent: number;
        totalPE: number;
        peCount: number;
        totalVolume: number;
        gainers: number;
        losers: number;
        neutral: number;
        count: number;
      }
    > = {} as any;

    for (const stock of stocks) {
      if (!aggregates[stock.sector]) {
        aggregates[stock.sector] = {
          totalPrice: 0,
          totalChangePercent: 0,
          totalPE: 0,
          peCount: 0,
          totalVolume: 0,
          gainers: 0,
          losers: 0,
          neutral: 0,
          count: 0,
        };
      }

      const agg = aggregates[stock.sector];
      agg.count++;
      agg.totalPrice += stock.price;
      agg.totalChangePercent += stock.changePercent;
      agg.totalVolume += stock.volume;

      if (stock.pe !== null) {
        agg.totalPE += stock.pe;
        agg.peCount++;
      }

      if (stock.changePercent > 0) {
        agg.gainers++;
      } else if (stock.changePercent < 0) {
        agg.losers++;
      } else {
        agg.neutral++;
      }
    }

    // Format output
    const sectorMetrics: SectorMetrics[] = Object.entries(aggregates).map(
      ([sectorName, agg]) => ({
        sector: sectorName as Sector,
        totalStocks: agg.count,
        avgPrice: parseFloat((agg.totalPrice / agg.count).toFixed(2)),
        avgChangePercent: parseFloat((agg.totalChangePercent / agg.count).toFixed(3)),
        avgPE: agg.peCount > 0 ? parseFloat((agg.totalPE / agg.peCount).toFixed(1)) : 0,
        totalVolume: agg.totalVolume,
        gainers: agg.gainers,
        losers: agg.losers,
        neutral: agg.neutral,
      })
    );

    return NextResponse.json({
      success: true,
      data: sectorMetrics,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

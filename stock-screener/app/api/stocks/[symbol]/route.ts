import { NextResponse, NextRequest } from "next/server";
import { getStockDataset } from "@/data/seedStocks";

/**
 * GET /api/stocks/[symbol]
 * Retrieves details for a single stock by its ticker symbol.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const symbol = (await params).symbol.toUpperCase().trim();
    
    // Retrieve stock dataset
    const stocks = getStockDataset();
    const stock = stocks.find((s) => s.symbol === symbol);

    if (!stock) {
      return NextResponse.json(
        { success: false, error: `Stock with symbol '${symbol}' not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: stock,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

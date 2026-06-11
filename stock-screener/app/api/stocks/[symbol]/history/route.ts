import { NextResponse, NextRequest } from "next/server";
import { getStockDataset, generateCandleHistory } from "@/data/seedStocks";

/**
 * GET /api/stocks/[symbol]/history
 * Returns historical candlestick data (OHLCV) for a given stock, based on timeframe query parameters.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const symbol = (await params).symbol.toUpperCase().trim();
    const { searchParams } = new URL(request.url);

    // Read timeframe and translate to trading days
    const tf = searchParams.get("timeframe") ?? "1M";
    
    // Day mappings
    const tfDays: Record<string, number> = {
      "1D": 1,
      "5D": 5,
      "1W": 7,
      "1M": 30,
      "3M": 90,
      "6M": 180,
      "1Y": 365,
      "5Y": 1825,
    };

    const days = tfDays[tf] ?? 30;

    const stocks = getStockDataset();
    const stock = stocks.find((s) => s.symbol === symbol);

    if (!stock) {
      return NextResponse.json(
        { success: false, error: `Stock '${symbol}' not found` },
        { status: 404 }
      );
    }

    // Generate physical consistent candles
    const candles = generateCandleHistory(stock.price, days);

    return NextResponse.json({
      success: true,
      data: {
        symbol,
        timeframe: tf,
        days,
        candles,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

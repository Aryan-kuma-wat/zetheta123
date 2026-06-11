import { NextResponse, NextRequest } from "next/server";
import { getStockDataset } from "@/data/seedStocks";

/**
 * GET /api/stocks
 * Returns the universe of stocks, supporting server-side filtering, sorting, and pagination.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Read query parameters
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const limit = parseInt(searchParams.get("limit") ?? "50", 10);
    const search = searchParams.get("search")?.toLowerCase().trim() ?? "";
    const sector = searchParams.get("sector") ?? "All";
    const sortBy = searchParams.get("sortBy") ?? "symbol";
    const sortDir = searchParams.get("sortDir") ?? "asc";

    // 1. Hydrate the 5000-stock universe
    let stocks = getStockDataset();

    // 2. Apply text search
    if (search) {
      stocks = stocks.filter(
        (s) =>
          s.symbol.toLowerCase().includes(search) ||
          s.name.toLowerCase().includes(search)
      );
    }

    // 3. Apply sector filter
    if (sector !== "All") {
      stocks = stocks.filter((s) => s.sector === sector);
    }

    // 4. Apply sorting
    stocks.sort((a: any, b: any) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];

      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      let comparison = 0;
      if (typeof aVal === "number" && typeof bVal === "number") {
        comparison = aVal - bVal;
      } else {
        comparison = String(aVal).localeCompare(String(bVal));
      }

      return sortDir === "asc" ? comparison : -comparison;
    });

    // 5. Apply pagination
    const totalItems = stocks.length;
    const totalPages = Math.ceil(totalItems / limit);
    const offset = (page - 1) * limit;
    const paginatedItems = stocks.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      data: {
        items: paginatedItems,
        total: totalItems,
        page,
        limit,
        totalPages,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

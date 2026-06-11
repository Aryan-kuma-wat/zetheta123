/**
 * Header.tsx
 * Location: src/components/Dashboard/Header.tsx
 *
 * Top navigation bar for the stock screener.
 * Shows:
 *  - App logo / title
 *  - Live market status badge
 *  - Total stock count (from the store)
 *  - Last updated timestamp
 */

"use client"; // Needed because we read from Zustand (client-side state)

import { useStockStore, selectStocksArray } from "@/store/useStockStore";

export default function Header() {
  // Read values from the store — component re-renders when these change
  const stocks = useStockStore(selectStocksArray);
  const loading = useStockStore((s) => s.loading);

  const totalStocks = stocks.length;
  const now = new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <header className="bg-gray-900 border-b border-gray-800 px-6 py-3">
      <div className="flex items-center justify-between gap-4 flex-wrap">

        {/* ── Left: Logo + Title ── */}
        <div className="flex items-center gap-3">
          {/* Simple SVG bar-chart icon */}
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
              />
            </svg>
          </div>

          <div>
            <h1 className="text-lg font-bold text-white leading-tight">
              StockScreener
            </h1>
            <p className="text-xs text-gray-400 leading-tight">
              Real-time market data
            </p>
          </div>
        </div>

        {/* ── Right: Status badges ── */}
        <div className="flex items-center gap-3 text-sm flex-wrap">

          {/* Market status pill */}
          <div className="flex items-center gap-1.5 bg-green-950 border border-green-800 text-green-400 px-3 py-1 rounded-full text-xs font-medium">
            {/* Pulsing green dot */}
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            Market Open
          </div>

          {/* Total stocks count */}
          <div className="text-gray-400">
            {loading ? (
              // Loading skeleton
              <span className="inline-block w-24 h-4 bg-gray-700 animate-pulse rounded" />
            ) : (
              <span>
                <span className="text-white font-semibold">
                  {totalStocks.toLocaleString()}
                </span>{" "}
                stocks loaded
              </span>
            )}
          </div>

          {/* Last updated time */}
          <div className="text-gray-500 text-xs hidden sm:block">
            Updated {now}
          </div>
        </div>
      </div>
    </header>
  );
}

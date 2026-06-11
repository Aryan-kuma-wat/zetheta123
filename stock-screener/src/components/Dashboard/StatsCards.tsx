/**
 * StatsCards.tsx
 * Location: src/components/Dashboard/StatsCards.tsx
 *
 * A row of 4 summary cards shown at the top of the dashboard:
 *
 *  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐
 *  │ Total     │ │ Gainers   │ │ Losers    │ │ Avg       │
 *  │ Stocks    │ │ Today     │ │ Today     │ │ Change %  │
 *  └───────────┘ └───────────┘ └───────────┘ └───────────┘
 *
 * All values are derived from the stock data in useStockStore.
 */

"use client";

import { useMemo } from "react";
import { useStockStore, selectStocksArray } from "@/store/useStockStore";

// ─────────────────────────────────────────────
//  Single card sub-component
// ─────────────────────────────────────────────

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  /** "neutral" | "positive" | "negative" */
  tone?: "neutral" | "positive" | "negative";
  loading?: boolean;
}

function StatCard({ title, value, subtitle, tone = "neutral", loading }: StatCardProps) {
  // Colour of the value number based on tone
  const valueColor =
    tone === "positive" ? "text-green-400" :
    tone === "negative" ? "text-red-400" :
    "text-white";

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col gap-1 hover:border-gray-700 transition-colors">
      {/* Card title */}
      <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">
        {title}
      </p>

      {/* Main value */}
      {loading ? (
        <div className="h-8 bg-gray-700 animate-pulse rounded w-20 mt-1" />
      ) : (
        <p className={`text-2xl font-bold ${valueColor} leading-tight`}>
          {value}
        </p>
      )}

      {/* Optional subtitle */}
      {subtitle && !loading && (
        <p className="text-xs text-gray-500">{subtitle}</p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
//  Main StatsCards component
// ─────────────────────────────────────────────

export default function StatsCards() {
  const stocks = useStockStore(selectStocksArray);
  const loading = useStockStore((s) => s.loading);

  // Compute stats — useMemo so it only recalculates when stocks array changes
  const stats = useMemo(() => {
    if (stocks.length === 0) {
      return { total: 0, gainers: 0, losers: 0, avgChange: 0 };
    }

    let gainers = 0;
    let losers = 0;
    let totalChange = 0;

    for (const stock of stocks) {
      if (stock.changePercent > 0) gainers++;
      else if (stock.changePercent < 0) losers++;
      totalChange += stock.changePercent;
    }

    const avgChange = totalChange / stocks.length;

    return { total: stocks.length, gainers, losers, avgChange };
  }, [stocks]);

  return (
    // 4 equal columns on medium+, 2 on small, 1 on mobile
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">

      <StatCard
        title="Total Stocks"
        value={stats.total.toLocaleString()}
        subtitle="Across all sectors"
        tone="neutral"
        loading={loading}
      />

      <StatCard
        title="Gainers"
        value={stats.gainers.toLocaleString()}
        subtitle={`${((stats.gainers / (stats.total || 1)) * 100).toFixed(1)}% of universe`}
        tone="positive"
        loading={loading}
      />

      <StatCard
        title="Losers"
        value={stats.losers.toLocaleString()}
        subtitle={`${((stats.losers / (stats.total || 1)) * 100).toFixed(1)}% of universe`}
        tone="negative"
        loading={loading}
      />

      <StatCard
        title="Avg Change"
        value={`${stats.avgChange >= 0 ? "+" : ""}${stats.avgChange.toFixed(2)}%`}
        subtitle="Market-wide today"
        tone={stats.avgChange >= 0 ? "positive" : "negative"}
        loading={loading}
      />

    </div>
  );
}

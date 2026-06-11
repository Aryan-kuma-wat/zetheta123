/**
 * page.tsx
 * Location: app/page.tsx
 *
 * This is the dashboard home page — the first thing the user sees.
 * Hydrates 5000 stock records, initializes WebSocket GBM streams,
 * and mounts actual virtualized tables, charting panels, watchlists,
 * and advanced filter engine sidebars.
 */

"use client";

import { useEffect, useState } from "react";
import { useStockStore } from "@/store/useStockStore";
import { getStockDataset } from "@/data/seedStocks";

import DashboardLayout from "@/components/Layout/DashboardLayout";
import Header from "@/components/Dashboard/Header";
import StatsCards from "@/components/Dashboard/StatsCards";

// Actual live components
import FilterPanel from "@/components/Filters/FilterPanel";
import StockTable from "@/components/Table/StockTable";
import ChartPanel from "@/components/Charts/ChartPanel";
import WatchlistPanel from "@/components/Dashboard/WatchlistPanel";
import MarketOverview from "@/components/Dashboard/MarketOverview";

// Hooks integration
import { useFilterEngine } from "@/hooks/useFilterEngine";
import { useWebSocket } from "@/hooks/useWebSocket";

export default function DashboardPage() {
  const setStocks = useStockStore((s) => s.setStocks);
  const setLoading = useStockStore((s) => s.setLoading);
  const [mounted, setMounted] = useState(false);

  // Set mounted state on client mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // 1. Initialize high-frequency local stocks seeder Map on load
  useEffect(() => {
    if (!mounted) return;
    setLoading(true);
    const timer = setTimeout(() => {
      const stocks = getStockDataset();
      setStocks(stocks);
      setLoading(false);
    }, 200);
    return () => clearTimeout(timer);
  }, [setStocks, setLoading, mounted]);

  // 2. Instantiate and bind real-time WebSocket GBM price updates
  // This hook registers the requestAnimationFrame batching queue automatically on mount
  useWebSocket();

  // 3. Subscribe to the compiled AST filter engine results
  const { filteredStocks } = useFilterEngine();

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-white select-none">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
          <p className="text-xs font-semibold text-gray-400 tracking-wide uppercase animate-pulse">
            Initializing Quantitative Screener Engine...
          </p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout
      header={<Header />}
      statsCards={<StatsCards />}
      
      // Left side: Filters (fixed height) & Watchlists (scrolls/grows)
      left={
        <div className="flex flex-col gap-4 h-full p-2 bg-gray-950/20 select-none">
          <div className="flex-shrink-0 h-[480px]">
            <FilterPanel />
          </div>
          <div className="flex-1 min-h-[250px]">
            <WatchlistPanel />
          </div>
        </div>
      }

      // Center: Virtualized Stock table with DOM flashes
      center={<StockTable data={filteredStocks} />}

      // Right side: Synced lightweight chart & Sector aggregates overview
      right={
        <div className="flex flex-col gap-4 h-full p-2 bg-gray-950/20 select-none">
          <div className="flex-1 min-h-[380px]">
            <ChartPanel />
          </div>
          <div className="h-[280px] flex-shrink-0">
            <MarketOverview />
          </div>
        </div>
      }
    />
  );
}


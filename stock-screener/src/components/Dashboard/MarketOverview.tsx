"use client";

import React, { useMemo, useState } from "react";
import { useStockStore, selectStocksArray } from "@/store/useStockStore";
import { useStockData } from "@/hooks/useStockData";
import { TrendingUp, TrendingDown, Layers, Sparkles, Star } from "lucide-react";

export default function MarketOverview() {
  const stocks = useStockStore(selectStocksArray);
  const { sectors, loadingSectors } = useStockData();

  const [activeTab, setActiveTab] = useState<"sectors" | "leaders">("sectors");
  const [leaderSubTab, setLeaderSubTab] = useState<"gainers" | "losers">("gainers");

  // Compute top gainers and losers on the stock universe
  const leaders = useMemo(() => {
    if (stocks.length === 0) return { gainers: [], losers: [] };

    // Sort clones to find extremes
    const sorted = [...stocks].filter(s => s.price > 1); // exclude sub-$1 pennies for realistic leaders

    const gainers = [...sorted]
      .sort((a, b) => b.changePercent - a.changePercent)
      .slice(0, 5);

    const losers = [...sorted]
      .sort((a, b) => a.changePercent - b.changePercent)
      .slice(0, 5);

    return { gainers, losers };
  }, [stocks]);

  // Select stock details on click
  const selectStock = useStockStore((s) => s.selectStock);

  return (
    <div className="flex flex-col h-full bg-gray-900 border border-gray-800 text-white rounded-xl overflow-hidden">
      
      {/* ── Tabs Header ── */}
      <div className="flex border-b border-gray-800 text-xs font-bold select-none bg-gray-950/20">
        <button
          onClick={() => setActiveTab("sectors")}
          className={`flex-1 py-3 px-4 text-center border-b-2 flex items-center justify-center gap-1.5 transition-all ${
            activeTab === "sectors"
              ? "border-blue-500 text-white bg-gray-900"
              : "border-transparent text-gray-400 hover:text-white hover:bg-gray-850/30"
          }`}
        >
          <Layers className="w-3.5 h-3.5" /> Sector Breadth
        </button>
        <button
          onClick={() => setActiveTab("leaders")}
          className={`flex-1 py-3 px-4 text-center border-b-2 flex items-center justify-center gap-1.5 transition-all ${
            activeTab === "leaders"
              ? "border-blue-500 text-white bg-gray-900"
              : "border-transparent text-gray-400 hover:text-white hover:bg-gray-850/30"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" /> Market Leaders
        </button>
      </div>

      {/* ── Content Body ── */}
      <div className="flex-1 overflow-y-auto p-4">

        {/* 1. Sector Breadth Advance-Decline Ratios */}
        {activeTab === "sectors" && (
          <div className="space-y-3.5 animate-fadeIn">
            <div className="flex justify-between items-center text-[10px] text-gray-500 font-semibold uppercase tracking-wider">
              <span>Sector Class</span>
              <span className="flex gap-2">
                <span className="text-green-400">Gainers</span>
                <span>/</span>
                <span className="text-red-400">Losers</span>
              </span>
            </div>

            {loadingSectors ? (
              // Loading list skeleton
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-6 bg-gray-800 rounded animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {sectors.map((sec) => {
                  const total = sec.gainers + sec.losers + sec.neutral || 1;
                  const gainPercent = (sec.gainers / total) * 100;
                  const losePercent = (sec.losers / total) * 100;
                  const neutPercent = 100 - gainPercent - losePercent;

                  return (
                    <div key={sec.sector} className="space-y-1">
                      {/* Labels */}
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-gray-200 truncate pr-2">{sec.sector}</span>
                        <span className="text-gray-400 text-[10px] flex-shrink-0">
                          <span className="text-green-400 font-bold">{sec.gainers}</span>
                          {" - "}
                          <span className="text-red-400 font-bold">{sec.losers}</span>
                        </span>
                      </div>

                      {/* Advance Decline ratio bar */}
                      <div className="h-2 w-full rounded-full overflow-hidden flex bg-gray-850">
                        {sec.gainers > 0 && (
                          <div
                            className="bg-green-500 h-full hover:opacity-85 transition-opacity"
                            style={{ width: `${gainPercent}%` }}
                            title={`${sec.gainers} Stocks Rising`}
                          />
                        )}
                        {sec.neutral > 0 && (
                          <div
                            className="bg-gray-650 h-full hover:opacity-85 transition-opacity"
                            style={{ width: `${neutPercent}%` }}
                            title={`${sec.neutral} Stocks Flat`}
                          />
                        )}
                        {sec.losers > 0 && (
                          <div
                            className="bg-red-500 h-full hover:opacity-85 transition-opacity"
                            style={{ width: `${losePercent}%` }}
                            title={`${sec.losers} Stocks Falling`}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 2. Top gainers / losers */}
        {activeTab === "leaders" && (
          <div className="space-y-4 animate-fadeIn">
            
            {/* Sub-tabs toggler */}
            <div className="grid grid-cols-2 p-0.5 bg-gray-950/40 rounded-lg border border-gray-800 text-[11px] font-bold">
              <button
                onClick={() => setLeaderSubTab("gainers")}
                className={`py-1 rounded flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                  leaderSubTab === "gainers"
                    ? "bg-green-950/50 text-green-400 border border-green-800/30"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <TrendingUp className="w-3 h-3" /> Top Gainers
              </button>
              <button
                onClick={() => setLeaderSubTab("losers")}
                className={`py-1 rounded flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                  leaderSubTab === "losers"
                    ? "bg-red-950/50 text-red-400 border border-red-800/30"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <TrendingDown className="w-3 h-3" /> Top Losers
              </button>
            </div>

            {/* List */}
            <div className="space-y-2 select-none">
              {(leaderSubTab === "gainers" ? leaders.gainers : leaders.losers).map((stock) => {
                const isPositive = stock.changePercent >= 0;
                
                return (
                  <div
                    key={stock.symbol}
                    onClick={() => selectStock(stock.symbol)}
                    className="px-3 py-2 bg-gray-950/30 hover:bg-gray-850 rounded-lg border border-gray-850 hover:border-gray-800 cursor-pointer flex items-center justify-between gap-3 text-xs transition-all group"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-white group-hover:text-blue-400 transition-colors">
                        {stock.symbol}
                      </p>
                      <p className="text-[10px] text-gray-500 truncate">{stock.name}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-semibold text-gray-200">
                        ${stock.price.toFixed(2)}
                      </p>
                      <p
                        className={`text-[10px] font-bold flex items-center justify-end gap-0.5 ${
                          isPositive ? "text-green-400" : "text-red-400"
                        }`}
                      >
                        {isPositive ? "+" : ""}
                        {stock.changePercent.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { useShallow } from "zustand/react/shallow";
import {
  useWatchlistStore,
  selectActiveListTickers,
  selectAllLists,
  selectActiveListName,
} from "@/store/useWatchlistStore";
import { useStockStore } from "@/store/useStockStore";
import { Plus, Trash2, FolderClosed, X, ChevronRight, Star } from "lucide-react";

export default function WatchlistPanel() {
  const lists = useWatchlistStore(useShallow(selectAllLists));
  const activeListName = useWatchlistStore(selectActiveListName);
  const activeTickers = useWatchlistStore(useShallow(selectActiveListTickers));

  const createList = useWatchlistStore((s) => s.createList);
  const deleteList = useWatchlistStore((s) => s.deleteList);
  const setActiveList = useWatchlistStore((s) => s.setActiveList);
  const removeTicker = useWatchlistStore((s) => s.removeTicker);

  const stocks = useStockStore((s) => s.stocks);
  const selectedStock = useStockStore((s) => s.selectedStock);
  const selectStock = useStockStore((s) => s.selectStock);

  // Local UI states
  const [newListName, setNewListName] = useState<string>("");
  const [showAddForm, setShowAddForm] = useState<boolean>(false);

  const handleCreateList = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;
    createList(newListName.trim());
    setNewListName("");
    setShowAddForm(false);
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 border border-gray-800 text-white rounded-xl overflow-hidden">
      
      {/* ── Subtitle Header ── */}
      <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500/20" />
          <h2 className="text-sm font-bold tracking-wide uppercase">Watchlists</h2>
        </div>
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="p-1 hover:bg-gray-800 text-gray-400 hover:text-white rounded transition-colors flex items-center gap-1 text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* ── List Creator Form ── */}
      {showAddForm && (
        <form
          onSubmit={handleCreateList}
          className="p-3 bg-gray-950 border-b border-gray-800 flex items-center gap-2 animate-fadeIn"
        >
          <input
            type="text"
            placeholder="New list name..."
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            required
            className="flex-1 bg-gray-900 border border-gray-800 rounded py-1 px-2 text-xs focus:outline-none focus:border-blue-500 text-white font-medium"
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white p-1 rounded font-bold text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setShowAddForm(false)}
            className="text-gray-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </form>
      )}

      {/* ── Watchlist Dropdown Switcher ── */}
      <div className="px-3 py-2 bg-gray-950/40 border-b border-gray-800 flex items-center gap-2 justify-between">
        <div className="flex items-center gap-1.5 min-w-0">
          <FolderClosed className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
          <select
            value={activeListName}
            onChange={(e) => setActiveList(e.target.value)}
            className="bg-transparent text-xs text-gray-200 focus:outline-none cursor-pointer font-semibold min-w-0 pr-4 select-none"
          >
            {lists.map((name) => (
              <option key={name} value={name} className="bg-gray-950 text-white">
                {name}
              </option>
            ))}
          </select>
        </div>
        {activeListName !== "My Watchlist" && (
          <button
            onClick={() => deleteList(activeListName)}
            title="Delete this watchlist"
            className="text-gray-500 hover:text-red-400 p-0.5 rounded transition-colors"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* ── Watchlist Tickers List ── */}
      <div className="flex-1 overflow-y-auto">
        {activeTickers.length === 0 ? (
          <div className="p-6 text-center text-xs text-gray-500 leading-relaxed flex flex-col items-center justify-center h-full gap-2">
            <Star className="w-8 h-8 text-gray-700" />
            <p>Your watchlist is empty.</p>
            <p className="text-[10px]">Click the star icon next to tickers in the stock grid to add them here.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-850">
            {activeTickers.map((ticker) => {
              const stock = stocks.get(ticker);
              if (!stock) return null;

              const isSelected = selectedStock === ticker;
              const isPositive = stock.changePercent >= 0;

              return (
                <div
                  key={ticker}
                  onClick={() => selectStock(ticker)}
                  className={`px-4 py-2.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-gray-850 transition-colors select-none group ${
                    isSelected ? "bg-blue-950/20 border-l-2 border-blue-500" : ""
                  }`}
                >
                  {/* Left: Ticker & Name */}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors">
                      {stock.symbol}
                    </p>
                    <p className="text-[10px] text-gray-500 truncate">{stock.name}</p>
                  </div>

                  {/* Center: Live Price & change */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-semibold text-gray-200">
                      ${stock.price.toFixed(stock.price > 10 ? 2 : 4)}
                    </p>
                    <p
                      className={`text-[10px] font-bold ${
                        isPositive ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {isPositive ? "+" : ""}
                      {stock.changePercent.toFixed(2)}%
                    </p>
                  </div>

                  {/* Right: Quick Remove */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeTicker(activeListName, ticker);
                    }}
                    className="p-1 text-gray-600 hover:text-red-400 hover:bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

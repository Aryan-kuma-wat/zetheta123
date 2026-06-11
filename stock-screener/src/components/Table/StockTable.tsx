"use client";

import React, { useMemo, useRef, useEffect, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useStockScreener } from "@/hooks/useStockScreener";
import { useWatchlistStore } from "@/store/useWatchlistStore";
import type { Stock } from "@/types/stock";
import { Star, ChevronUp, ChevronDown, Check, SlidersHorizontal } from "lucide-react";

const columnHelper = createColumnHelper<Stock>();

// ─────────────────────────────────────────────
//  DOM-based Flashing Cell
// ─────────────────────────────────────────────

interface FlashCellProps {
  value: number;
  format: "price" | "percent" | "volume" | "marketcap" | "decimal";
  isChange?: boolean;
}

const FlashCell = React.memo(({ value, format, isChange = false }: FlashCellProps) => {
  const prevValueRef = useRef<number>(value);
  const elementRef = useRef<HTMLSpanElement>(null);
  
  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    const prev = prevValueRef.current;
    if (value > prev) {
      // Flash Green
      el.classList.add("text-green-400", "scale-105");
      const t = setTimeout(() => {
        el.classList.remove("text-green-400", "scale-105");
      }, 500);
      prevValueRef.current = value;
      return () => clearTimeout(t);
    } else if (value < prev) {
      // Flash Red
      el.classList.add("text-red-400", "scale-105");
      const t = setTimeout(() => {
        el.classList.remove("text-red-400", "scale-105");
      }, 500);
      prevValueRef.current = value;
      return () => clearTimeout(t);
    }
  }, [value]);

  // Format values for human-readability
  const formatted = useMemo(() => {
    if (value === null || value === undefined) return "—";

    switch (format) {
      case "price":
        return `$${value.toFixed(value > 10 ? 2 : 4)}`;
      case "percent":
        return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
      case "volume":
        if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
        if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
        return value.toLocaleString();
      case "marketcap":
        if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
        if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
        if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
        return `$${value.toLocaleString()}`;
      case "decimal":
        return value.toFixed(2);
      default:
        return String(value);
    }
  }, [value, format]);

  let staticColor = "text-gray-250";
  if (isChange) {
    staticColor = value >= 0 ? "text-green-500 font-semibold" : "text-red-500 font-semibold";
  }

  return (
    <span
      ref={elementRef}
      className={`inline-block transition-all duration-300 transform origin-right ${staticColor}`}
    >
      {formatted}
    </span>
  );
});

FlashCell.displayName = "FlashCell";

// ─────────────────────────────────────────────
//  Main Stock Table
// ─────────────────────────────────────────────

interface StockTableProps {
  data: Stock[];
}

export default function StockTable({ data }: StockTableProps) {
  const {
    selectedStock,
    selectStock,
    sorting,
    setSorting,
    columnVisibility,
    toggleColumn,
    applyColumnPreset,
    isVirtualized,
    setVirtualized,
  } = useStockScreener();

  const activeWatchlist = useWatchlistStore((s: any) => s.activeList);
  const toggleWatchlist = useWatchlistStore((s: any) => s.toggleTicker);
  const watchlistTickers = useWatchlistStore((s: any) => s.lists[activeWatchlist] ?? []);

  // UI state for dropdown options
  const [showColSettings, setShowColSettings] = useState(false);

  // Columns definition mapping
  const columns = useMemo(
    () => [
      // Column 1: Star icon for Watchlist
      columnHelper.display({
        id: "watchlist",
        header: "",
        cell: (info) => {
          const symbol = info.row.original.symbol;
          const isInWatchlist = watchlistTickers.includes(symbol);
          
          return (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleWatchlist(activeWatchlist, symbol);
              }}
              className="p-1 hover:bg-gray-800 rounded transition-colors group cursor-pointer"
              title={isInWatchlist ? "Remove from watchlist" : "Add to watchlist"}
            >
              <Star
                className={`w-3.5 h-3.5 ${
                  isInWatchlist
                    ? "text-yellow-500 fill-yellow-500"
                    : "text-gray-600 group-hover:text-yellow-500"
                }`}
              />
            </button>
          );
        },
      }),

      // Column 2: Ticker Symbol
      columnHelper.accessor("symbol", {
        header: "Symbol",
        cell: (info) => (
          <span className="font-bold text-blue-400 group-hover:text-blue-300 transition-colors uppercase">
            {info.getValue()}
          </span>
        ),
      }),

      // Column 3: Company Name
      columnHelper.accessor("name", {
        header: "Name",
        cell: (info) => (
          <span className="text-gray-300 truncate block max-w-28 font-medium">
            {info.getValue()}
          </span>
        ),
      }),

      // Column 4: Price
      columnHelper.accessor("price", {
        header: "Price",
        cell: (info) => <FlashCell value={info.getValue()} format="price" />,
      }),

      // Column 5: Change
      columnHelper.accessor("change", {
        header: "Chg ($)",
        cell: (info) => <FlashCell value={info.getValue()} format="decimal" isChange />,
      }),

      // Column 6: Change (%)
      columnHelper.accessor("changePercent", {
        header: "Chg (%)",
        cell: (info) => <FlashCell value={info.getValue()} format="percent" isChange />,
      }),

      // Column 7: Volume
      columnHelper.accessor("volume", {
        header: "Volume",
        cell: (info) => <FlashCell value={info.getValue()} format="volume" />,
      }),

      // Column 8: Market Cap
      columnHelper.accessor("marketCap", {
        header: "Market Cap",
        cell: (info) => <FlashCell value={info.getValue()} format="marketcap" />,
      }),

      // Column 9: P/E
      columnHelper.accessor("pe", {
        header: "P/E",
        cell: (info) => {
          const val = info.getValue();
          return val !== null && val !== undefined ? (
            <span className="text-gray-300 font-semibold">{val.toFixed(1)}</span>
          ) : (
            <span className="text-gray-600">—</span>
          );
        },
      }),

      // Column 10: P/B
      columnHelper.accessor("pb", {
        header: "P/B",
        cell: (info) => {
          const val = info.getValue();
          return val !== null && val !== undefined ? (
            <span className="text-gray-300">{val.toFixed(2)}</span>
          ) : (
            <span className="text-gray-600">—</span>
          );
        },
      }),

      // Column 11: ROE
      columnHelper.accessor("roe", {
        header: "ROE %",
        cell: (info) => {
          const val = info.getValue();
          return val !== null && val !== undefined ? (
            <span className={`font-semibold ${val >= 15 ? "text-emerald-400" : "text-gray-300"}`}>
              {val.toFixed(1)}%
            </span>
          ) : (
            <span className="text-gray-600">—</span>
          );
        },
      }),

      // Column 12: RSI
      columnHelper.accessor("rsi", {
        header: "RSI",
        cell: (info) => {
          const val = info.getValue();
          let rsiColor = "text-gray-300";
          if (val >= 70) rsiColor = "text-red-400 font-bold bg-red-950/20 px-1 rounded";
          else if (val <= 30) rsiColor = "text-green-400 font-bold bg-green-950/20 px-1 rounded";

          return <span className={rsiColor}>{val.toFixed(1)}</span>;
        },
      }),

      // Column 13: Beta
      columnHelper.accessor("beta", {
        header: "Beta",
        cell: (info) => {
          const val = info.getValue();
          return <span className="text-gray-400">{val.toFixed(2)}</span>;
        },
      }),

      // Column 14: Sector
      columnHelper.accessor("sector", {
        header: "Sector",
        cell: (info) => (
          <span className="text-gray-400 truncate block max-w-24 text-[10px] uppercase font-semibold">
            {info.getValue()}
          </span>
        ),
      }),
    ],
    [watchlistTickers, activeWatchlist, toggleWatchlist]
  );

  // Initialize TanStack Table
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
    },
    onSortingChange: setSorting,
    onColumnVisibilityChange: toggleColumn as any,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const { rows } = table.getRowModel();

  // Scroll viewport ref for virtualization
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // Initialize TanStack Virtual row virtualizer
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 36, // height of row in px
    overscan: 10, // buffer of rows above/below viewport
  });

  const virtualRows = rowVirtualizer.getVirtualItems();
  const totalHeight = rowVirtualizer.getTotalSize();

  return (
    <div className="flex flex-col h-full bg-gray-900 overflow-hidden text-white rounded-xl relative">
      
      {/* ── Grid Controls Header ── */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-gray-800 flex items-center justify-between gap-4 bg-gray-950/25">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
            Stock Screener
          </span>
          <span className="bg-gray-800 text-[10px] text-gray-300 font-bold px-2 py-0.5 rounded-full">
            {data.length} records
          </span>
        </div>

        {/* Layout Preferences Controls */}
        <div className="flex items-center gap-2 relative">
          
          {/* Virtual scroll toggler */}
          <button
            onClick={() => setVirtualized(!isVirtualized)}
            className={`px-2 py-1 rounded text-[10px] font-bold border transition-all cursor-pointer ${
              isVirtualized
                ? "bg-blue-950 border-blue-800 text-blue-400"
                : "border-gray-800 text-gray-500 hover:text-white"
            }`}
            title="Enable/disable virtualised rendering"
          >
            Virtual Scroll
          </button>

          {/* Columns settings dropdown button */}
          <button
            onClick={() => setShowColSettings(!showColSettings)}
            className="p-1 hover:bg-gray-800 rounded border border-gray-800 transition-colors flex items-center gap-1 text-xs text-gray-400 hover:text-white cursor-pointer"
            title="Configure columns visibility"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>

          {/* Columns popover */}
          {showColSettings && (
            <div className="absolute right-0 top-8 z-50 bg-gray-950 border border-gray-800 rounded-xl p-3 w-60 shadow-2xl flex flex-col gap-2.5 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-gray-850 pb-1.5">
                <span className="text-xs font-bold text-gray-300">Visible Columns</span>
                <div className="flex gap-1.5 text-[9px] font-bold text-blue-400">
                  <button onClick={() => applyColumnPreset("default")} className="hover:underline">Default</button>
                  <span>|</span>
                  <button onClick={() => applyColumnPreset("advanced")} className="hover:underline">Advanced</button>
                </div>
              </div>

              {/* Toggles scroll */}
              <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1 select-none">
                {table.getAllLeafColumns().map((column) => {
                  if (column.id === "watchlist" || column.id === "symbol" || column.id === "name") return null;
                  
                  const isVisible = column.getIsVisible();
                  
                  return (
                    <label
                      key={column.id}
                      className="flex items-center gap-2 text-[11px] text-gray-400 hover:text-white cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={isVisible}
                        onChange={column.getToggleVisibilityHandler()}
                        className="rounded border-gray-800 bg-gray-900 checked:bg-blue-600 focus:ring-0 w-3 h-3 cursor-pointer"
                      />
                      <span>
                        {String(column.columnDef.header || column.id)}
                      </span>
                    </label>
                  );
                })}
              </div>

              <button
                onClick={() => setShowColSettings(false)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-[10px] mt-1 transition-colors"
              >
                Close Settings
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Virtual Grid Viewport ── */}
      <div
        ref={tableContainerRef}
        className="flex-1 overflow-auto bg-gray-950/20"
        style={{ contentVisibility: "auto" }}
      >
        <table className="w-full text-left border-collapse table-fixed select-none">
          {/* Header Row */}
          <thead className="sticky top-0 bg-gray-900/95 border-b border-gray-800 z-10 text-[10px] font-bold uppercase tracking-wider text-gray-500 select-none">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const isSortable = header.column.getCanSort();
                  const sortDir = header.column.getIsSorted();
                  
                  return (
                    <th
                      key={header.id}
                      style={{ width: header.getSize() }}
                      className={`px-3 py-2 text-left font-semibold ${
                        isSortable ? "cursor-pointer hover:bg-gray-800/50 hover:text-white" : ""
                      } transition-colors select-none`}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div className="flex items-center gap-1 min-w-0">
                        <span className="truncate">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </span>
                        {isSortable && (
                          <span className="text-gray-600 flex-shrink-0">
                            {sortDir === "asc" ? (
                              <ChevronUp className="w-3 h-3 text-blue-500" />
                            ) : sortDir === "desc" ? (
                              <ChevronDown className="w-3 h-3 text-blue-500" />
                            ) : null}
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>

          {/* Virtual scroll body */}
          <tbody
            style={{
              position: "relative",
              height: isVirtualized ? `${totalHeight}px` : "auto",
            }}
          >
            {isVirtualized ? (
              // 1. HIGH PERFORMANCE VIRTUALIZED RENDERING
              virtualRows.map((virtualRow) => {
                const row = rows[virtualRow.index];
                const symbol = row.original.symbol;
                const isSelected = selectedStock === symbol;

                return (
                  <tr
                    key={row.id}
                    onClick={() => selectStock(symbol)}
                    className={`group cursor-pointer border-b border-gray-850 hover:bg-gray-850/30 transition-colors h-[36px] ${
                      isSelected ? "bg-blue-950/20 border-l-2 border-blue-500" : ""
                    }`}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "36px",
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-3 py-1.5 text-xs truncate max-w-24 text-gray-250 select-none">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                );
              })
            ) : (
              // 2. STANDARD PAGINATED RENDERING (FALLBACK)
              rows.slice(0, 100).map((row) => {
                const symbol = row.original.symbol;
                const isSelected = selectedStock === symbol;

                return (
                  <tr
                    key={row.id}
                    onClick={() => selectStock(symbol)}
                    className={`group cursor-pointer border-b border-gray-850 hover:bg-gray-850/30 transition-colors h-[36px] ${
                      isSelected ? "bg-blue-950/20 border-l-2 border-blue-500" : ""
                    }`}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-3 py-1.5 text-xs truncate max-w-24 text-gray-250 select-none">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {rows.length === 0 && (
          <div className="p-8 text-center text-xs text-gray-500 flex flex-col items-center justify-center gap-2">
            <p className="font-semibold text-gray-400">No stocks matching your criteria.</p>
            <p>Try clearing some filters on the sidebar to widen your search scope.</p>
          </div>
        )}
      </div>
    </div>
  );
}

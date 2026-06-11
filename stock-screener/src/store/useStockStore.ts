/**
 * useStockStore.ts
 * Location: src/store/useStockStore.ts
 *
 * This is the main store for all stock data.
 * It holds a Map of stocks (fast lookup by symbol),
 * tracks which stock is selected, and manages loading state.
 *
 * Why a Map instead of an array?
 *   Map lets us do stocks.get("AAPL") in O(1) time.
 *   Finding an item in an array takes O(n) — much slower for 5000 stocks.
 */

import { create } from "zustand";
import type { Stock, StockPatch } from "@/types/stock";

// ─────────────────────────────────────────────
//  Types
// ─────────────────────────────────────────────

interface StockState {
  /** All stocks stored by symbol for fast lookup */
  stocks: Map<string, Stock>;

  /** Stable array of all stocks */
  stocksArray: Stock[];

  /** The currently selected ticker, e.g. "AAPL" */
  selectedStock: string | null;

  /** True while the initial stock data is being loaded */
  loading: boolean;
}

interface StockActions {
  /**
   * Load the full list of stocks into the store.
   * Call this once when the app starts.
   *
   * @example
   * const { setStocks } = useStockStore();
   * setStocks(await fetchAllStocks());
   */
  setStocks: (stocks: Stock[]) => void;

  /**
   * Update a single stock's data (e.g. after a price change).
   * Only updates the fields you pass — leaves everything else unchanged.
   *
   * @example
   * updateStock("AAPL", { price: 193.45, changePercent: 1.2 });
   */
  updateStock: (symbol: string, patch: Partial<Stock>) => void;

  /**
   * Batch update multiple stocks at once. Very high performance.
   * Prevents multiple React re-render cycles by combining into a single state change.
   */
  updateStocksBatch: (patches: StockPatch[]) => void;

  /**
   * Set the currently selected stock symbol.
   * Pass null to deselect.
   *
   * @example
   * selectStock("TSLA");  // select
   * selectStock(null);    // deselect
   */
  selectStock: (symbol: string | null) => void;

  /**
   * Toggle the loading spinner on or off.
   *
   * @example
   * setLoading(true);
   * const data = await fetchStocks();
   * setLoading(false);
   */
  setLoading: (loading: boolean) => void;
}

// ─────────────────────────────────────────────
//  Store
// ─────────────────────────────────────────────

export const useStockStore = create<StockState & StockActions>()((set, get) => ({
  // ── Initial state ────────────────────────────
  stocks: new Map(),
  stocksArray: [],
  selectedStock: null,
  loading: false,

  // ── Actions ──────────────────────────────────

  setStocks: (stockArray) => {
    // Convert the array into a Map so we can look up stocks by symbol instantly
    const stocks = new Map<string, Stock>();
    for (const stock of stockArray) {
      stocks.set(stock.symbol, stock);
    }
    set({ stocks, stocksArray: stockArray });
  },

  updateStock: (symbol, patch) => {
    const { stocks, stocksArray } = get();

    // Find the existing stock
    const existing = stocks.get(symbol);
    if (!existing) return; // stock not found, do nothing

    const updated = { ...existing, ...patch };

    // Create a new Map so React knows something changed
    const nextStocks = new Map(stocks);
    nextStocks.set(symbol, updated);

    // Update the array with stable reference
    const nextStocksArray = stocksArray.map((s) => s.symbol === symbol ? updated : s);

    set({ stocks: nextStocks, stocksArray: nextStocksArray });
  },

  updateStocksBatch: (patches) => {
    const { stocks, stocksArray } = get();
    const nextStocks = new Map(stocks);
    
    // Build quick patch map for fast array updates
    const patchMap = new Map<string, StockPatch>();
    for (let i = 0; i < patches.length; i++) {
      patchMap.set(patches[i].symbol, patches[i]);
    }

    let changed = false;
    const nextStocksArray = stocksArray.map((stock) => {
      const patch = patchMap.get(stock.symbol);
      if (patch) {
        const updated = { ...stock, ...patch };
        nextStocks.set(stock.symbol, updated);
        changed = true;
        return updated;
      }
      return stock;
    });

    if (changed) {
      set({ stocks: nextStocks, stocksArray: nextStocksArray });
    }
  },

  selectStock: (symbol) => {
    set({ selectedStock: symbol });
  },

  setLoading: (loading) => {
    set({ loading });
  },
}));

// ─────────────────────────────────────────────
//  Helper selectors
//
//  Use these to read specific slices of state.
//  This way your component only re-renders when
//  that specific value changes.
// ─────────────────────────────────────────────

/** Get a single stock by symbol */
export const getStock = (symbol: string) =>
  useStockStore.getState().stocks.get(symbol);

/** Get all stocks as a plain array (for rendering lists/tables) */
export const selectStocksArray = (state: StockState & StockActions): Stock[] =>
  state.stocksArray;

/** Get just the selected stock object (or undefined if nothing is selected) */
export const selectSelectedStockData = (state: StockState & StockActions): Stock | undefined => {
  if (!state.selectedStock) return undefined;
  return state.stocks.get(state.selectedStock);
};

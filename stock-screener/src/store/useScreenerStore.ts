import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { SortingState, VisibilityState as ColumnVisibilityState } from "@tanstack/react-table";

// ─────────────────────────────────────────────
//  Column preset definitions
// ─────────────────────────────────────────────

/** Default visible columns for the screener table */
export const DEFAULT_COLUMN_VISIBILITY: ColumnVisibilityState = {
  symbol: true,
  name: true,
  price: true,
  change: true,
  changePercent: true,
  volume: true,
  marketCap: true,
  marketCapCategory: false,
  sector: true,
  exchange: false,
  high: true,
  low: true,
  open: false,
  close: false,
  pe: true,
  eps: false,
  rsi: true,
  beta: false,
  dividendYield: false,
  week52High: false,
  week52Low: false,
  avgVolume: false,
  industry: false,
};

/** Advanced view — show all financial columns */
export const ADVANCED_COLUMN_VISIBILITY: ColumnVisibilityState = {
  ...Object.fromEntries(Object.keys(DEFAULT_COLUMN_VISIBILITY).map((k) => [k, true])),
};

// ─────────────────────────────────────────────
//  State shape
// ─────────────────────────────────────────────

interface ScreenerState {
  /** TanStack Table sort state */
  sorting: SortingState;

  /** Per-column visibility map */
  columnVisibility: ColumnVisibilityState;

  /** Global text search across symbol + name */
  globalSearch: string;

  /** Set of selected ticker symbols (for bulk actions) */
  selectedTickers: Set<string>;

  /** Number of rows per page (for pagination fallback when virtual is disabled) */
  rowsPerPage: number;

  /** Whether row virtualization is active */
  isVirtualized: boolean;
}

// ─────────────────────────────────────────────
//  Actions shape
// ─────────────────────────────────────────────

interface ScreenerActions {
  setSorting: (sorting: SortingState) => void;
  setColumnVisibility: (visibility: ColumnVisibilityState) => void;
  toggleColumn: (columnId: string) => void;
  resetColumns: () => void;
  applyColumnPreset: (preset: "default" | "advanced") => void;

  setGlobalSearch: (search: string) => void;

  selectTicker: (symbol: string) => void;
  deselectTicker: (symbol: string) => void;
  toggleTickerSelection: (symbol: string) => void;
  selectAllTickers: (symbols: string[]) => void;
  clearSelection: () => void;

  setRowsPerPage: (n: number) => void;
  setVirtualized: (enabled: boolean) => void;
}

// ─────────────────────────────────────────────
//  Store
// ─────────────────────────────────────────────

export const useScreenerStore = create<ScreenerState & ScreenerActions>()(
  persist(
    (set, get) => ({
      sorting: [{ id: "changePercent", desc: true }],
      columnVisibility: DEFAULT_COLUMN_VISIBILITY,
      globalSearch: "",
      selectedTickers: new Set<string>(),
      rowsPerPage: 50,
      isVirtualized: true,

      // ── sorting ───────────────────────────────
      setSorting: (sorting) => set({ sorting }),

      // ── column visibility ─────────────────────
      setColumnVisibility: (visibility) => set({ columnVisibility: visibility }),

      toggleColumn: (columnId) =>
        set((s) => ({
          columnVisibility: {
            ...s.columnVisibility,
            [columnId]: !s.columnVisibility[columnId],
          },
        })),

      resetColumns: () => set({ columnVisibility: DEFAULT_COLUMN_VISIBILITY }),

      applyColumnPreset: (preset) =>
        set({
          columnVisibility:
            preset === "advanced"
              ? ADVANCED_COLUMN_VISIBILITY
              : DEFAULT_COLUMN_VISIBILITY,
        }),

      // ── search ────────────────────────────────
      setGlobalSearch: (globalSearch) => set({ globalSearch }),

      // ── selection ─────────────────────────────
      selectTicker: (symbol) =>
        set((s) => {
          const next = new Set(s.selectedTickers);
          next.add(symbol);
          return { selectedTickers: next };
        }),

      deselectTicker: (symbol) =>
        set((s) => {
          const next = new Set(s.selectedTickers);
          next.delete(symbol);
          return { selectedTickers: next };
        }),

      toggleTickerSelection: (symbol) => {
        const { selectedTickers, selectTicker, deselectTicker } = get();
        selectedTickers.has(symbol) ? deselectTicker(symbol) : selectTicker(symbol);
      },

      selectAllTickers: (symbols) =>
        set({ selectedTickers: new Set(symbols) }),

      clearSelection: () => set({ selectedTickers: new Set<string>() }),

      // ── table config ──────────────────────────
      setRowsPerPage: (rowsPerPage) => set({ rowsPerPage }),
      setVirtualized: (isVirtualized) => set({ isVirtualized }),
    }),
    {
      name: "stock-screener-table",
      // Persist layout prefs only — not transient search/selection
      partialize: (s) => ({
        sorting: s.sorting,
        columnVisibility: s.columnVisibility,
        rowsPerPage: s.rowsPerPage,
        isVirtualized: s.isVirtualized,
      }),
    }
  )
);

// ─────────────────────────────────────────────
//  Selectors
// ─────────────────────────────────────────────

export const selectSorting = (s: ScreenerState & ScreenerActions) => s.sorting;
export const selectColumnVisibility = (s: ScreenerState & ScreenerActions) => s.columnVisibility;
export const selectGlobalSearch = (s: ScreenerState & ScreenerActions) => s.globalSearch;
export const selectSelectedTickers = (s: ScreenerState & ScreenerActions) => s.selectedTickers;
export const selectSelectionCount = (s: ScreenerState & ScreenerActions) => s.selectedTickers.size;

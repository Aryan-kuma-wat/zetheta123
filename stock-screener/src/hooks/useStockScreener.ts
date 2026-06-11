import { useScreenerStore } from "@/store/useScreenerStore";
import { useStockStore } from "@/store/useStockStore";

/**
 * Coordination hook for table configurations, selections, and layouts.
 */
export function useStockScreener() {
  const selectedStock = useStockStore((s: any) => s.selectedStock);
  const selectStock = useStockStore((s: any) => s.selectStock);

  // Screener layout states
  const sorting = useScreenerStore((s: any) => s.sorting);
  const columnVisibility = useScreenerStore((s: any) => s.columnVisibility);
  const globalSearch = useScreenerStore((s: any) => s.globalSearch);
  const selectedTickers = useScreenerStore((s: any) => s.selectedTickers);
  const rowsPerPage = useScreenerStore((s: any) => s.rowsPerPage);
  const isVirtualized = useScreenerStore((s: any) => s.isVirtualized);

  // Screener actions
  const setSorting = useScreenerStore((s: any) => s.setSorting);
  const setColumnVisibility = useScreenerStore((s: any) => s.setColumnVisibility);
  const toggleColumn = useScreenerStore((s: any) => s.toggleColumn);
  const resetColumns = useScreenerStore((s: any) => s.resetColumns);
  const applyColumnPreset = useScreenerStore((s: any) => s.applyColumnPreset);
  const setGlobalSearch = useScreenerStore((s: any) => s.setGlobalSearch);
  
  const selectTicker = useScreenerStore((s: any) => s.selectTicker);
  const deselectTicker = useScreenerStore((s: any) => s.deselectTicker);
  const toggleTickerSelection = useScreenerStore((s: any) => s.toggleTickerSelection);
  const selectAllTickers = useScreenerStore((s: any) => s.selectAllTickers);
  const clearSelection = useScreenerStore((s: any) => s.clearSelection);

  const setRowsPerPage = useScreenerStore((s: any) => s.setRowsPerPage);
  const setVirtualized = useScreenerStore((s: any) => s.setVirtualized);

  return {
    // Current stock context
    selectedStock,
    selectStock,

    // Grid states
    sorting,
    columnVisibility,
    globalSearch,
    selectedTickers,
    rowsPerPage,
    isVirtualized,

    // Grid actions
    setSorting,
    setColumnVisibility,
    toggleColumn,
    resetColumns,
    applyColumnPreset,
    setGlobalSearch,
    
    // Row selection
    selectTicker,
    deselectTicker,
    toggleTickerSelection,
    selectAllTickers,
    clearSelection,
    selectionCount: selectedTickers.size,

    // Pagination/Virtual configs
    setRowsPerPage,
    setVirtualized,
  };
}

export default useStockScreener;

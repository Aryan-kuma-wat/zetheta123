import { create } from "zustand";
import { persist } from "zustand/middleware";
import { nanoid } from "nanoid";
import type { Timeframe, IndicatorConfig, IndicatorType, CrosshairMode, ChartTheme } from "@/types/chart";
import { INDICATOR_DEFAULTS } from "@/types/chart";

interface ChartState {
  activeTicker: string | null;
  timeframe: Timeframe;
  activeIndicators: IndicatorConfig[];
  crosshairMode: CrosshairMode;
  theme: ChartTheme;
  isChartOpen: boolean;
}

interface ChartActions {
  openChart: (ticker: string) => void;
  closeChart: () => void;
  setTimeframe: (timeframe: Timeframe) => void;
  addIndicator: (type: IndicatorType) => IndicatorConfig;
  removeIndicator: (id: string) => void;
  toggleIndicator: (id: string) => void;
  updateIndicatorParam: (id: string, key: string, value: number) => void;
  updateIndicatorColor: (id: string, color: string) => void;
  clearIndicators: () => void;
  setCrosshairMode: (mode: CrosshairMode) => void;
  setTheme: (theme: ChartTheme) => void;
}

const DEFAULT_INDICATORS: IndicatorConfig[] = [
  { id: "default-sma20", type: "SMA", params: { period: 20 }, color: INDICATOR_DEFAULTS.SMA.color, visible: true },
  { id: "default-sma50", type: "SMA", params: { period: 50 }, color: "#f97316", visible: true },
];

export const useChartStore = create<ChartState & ChartActions>()(
  persist(
    (set) => ({
      activeTicker: null,
      timeframe: "1M",
      activeIndicators: DEFAULT_INDICATORS,
      crosshairMode: "normal",
      theme: "dark",
      isChartOpen: false,

      openChart: (ticker) => set({ activeTicker: ticker, isChartOpen: true }),
      closeChart: () => set({ isChartOpen: false, activeTicker: null }),
      setTimeframe: (timeframe) => set({ timeframe }),

      addIndicator: (type) => {
        const defaults = INDICATOR_DEFAULTS[type];
        const indicator: IndicatorConfig = {
          id: nanoid(),
          type,
          params: { ...defaults.params },
          color: defaults.color,
          visible: true,
        };
        set((s) => ({ activeIndicators: [...s.activeIndicators, indicator] }));
        return indicator;
      },

      removeIndicator: (id) =>
        set((s) => ({ activeIndicators: s.activeIndicators.filter((i) => i.id !== id) })),

      toggleIndicator: (id) =>
        set((s) => ({
          activeIndicators: s.activeIndicators.map((i) =>
            i.id === id ? { ...i, visible: !i.visible } : i
          ),
        })),

      updateIndicatorParam: (id, key, value) =>
        set((s) => ({
          activeIndicators: s.activeIndicators.map((i) =>
            i.id === id ? { ...i, params: { ...i.params, [key]: value } } : i
          ),
        })),

      updateIndicatorColor: (id, color) =>
        set((s) => ({
          activeIndicators: s.activeIndicators.map((i) =>
            i.id === id ? { ...i, color } : i
          ),
        })),

      clearIndicators: () => set({ activeIndicators: [] }),
      setCrosshairMode: (crosshairMode) => set({ crosshairMode }),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: "stock-screener-chart",
      partialize: (s) => ({
        timeframe: s.timeframe,
        activeIndicators: s.activeIndicators,
        crosshairMode: s.crosshairMode,
        theme: s.theme,
      }),
    }
  )
);

export const selectActiveTicker = (s: ChartState & ChartActions) => s.activeTicker;
export const selectTimeframe = (s: ChartState & ChartActions) => s.timeframe;
export const selectActiveIndicators = (s: ChartState & ChartActions) => s.activeIndicators;
export const selectIsChartOpen = (s: ChartState & ChartActions) => s.isChartOpen;
export const selectChartTheme = (s: ChartState & ChartActions) => s.theme;

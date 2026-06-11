import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { FilterRule, FilterPreset } from "@/types/filter";
import { nanoid } from "nanoid";

export type SectorFilter =
  | "All"
  | "Technology"
  | "Healthcare"
  | "Finance"
  | "Energy"
  | "Consumer Discretionary"
  | "Consumer Staples"
  | "Industrials"
  | "Materials"
  | "Real Estate"
  | "Utilities"
  | "Communication Services";

export type MarketCapFilter = "All" | "Mega" | "Large" | "Mid" | "Small" | "Micro" | "Nano";

export interface PriceRange {
  min: number | null;
  max: number | null;
}

// ─────────────────────────────────────────────
//  Initial Preset Templates
// ─────────────────────────────────────────────

const DEFAULT_PRESETS: FilterPreset[] = [
  {
    id: "preset-undervalued-growth",
    name: "Undervalued Growth",
    description: "Technology or Finance stocks with low P/E (< 25) and high ROE (> 15%)",
    rules: [
      { id: "rule-1", kind: "categorical", field: "sector", operator: "in", value: ["Technology", "Finance"] },
      { id: "rule-2", kind: "numeric", field: "pe", operator: "lt", value: 25 },
      { id: "rule-3", kind: "numeric", field: "roe", operator: "gt", value: 15 },
    ],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "preset-oversold-rallies",
    name: "Oversold RSI Rebound",
    description: "Stocks in oversold territory (RSI < 30) with stable Beta (< 1.2)",
    rules: [
      { id: "rule-4", kind: "numeric", field: "rsi", operator: "lt", value: 30 },
      { id: "rule-5", kind: "numeric", field: "beta", operator: "lt", value: 1.2 },
    ],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "preset-mega-dividend",
    name: "Mega-Cap Dividend Payers",
    description: "Mega-cap companies yielding over 3% dividend",
    rules: [
      { id: "rule-6", kind: "categorical", field: "marketCapCategory", operator: "in", value: ["Mega"] },
      { id: "rule-7", kind: "numeric", field: "dividendYield", operator: "gt", value: 3.0 },
    ],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

// ─────────────────────────────────────────────
//  State & Actions
// ─────────────────────────────────────────────

interface FilterState {
  // Flat filters
  search: string;
  sector: SectorFilter;
  priceRange: PriceRange;
  marketCap: MarketCapFilter;

  // AST Advanced Rules
  rules: FilterRule[];
  presets: FilterPreset[];
  activePresetId: string | null;
  isPanelOpen: boolean;
}

interface FilterActions {
  // Flat actions
  setSearch: (text: string) => void;
  setSector: (sector: SectorFilter) => void;
  setPriceRange: (range: PriceRange) => void;
  setMarketCap: (cap: MarketCapFilter) => void;
  resetFilters: () => void;

  // AST Advanced Rules actions
  addRule: (rule: FilterRule) => void;
  removeRule: (id: string) => void;
  updateRule: (id: string, patch: Partial<FilterRule>) => void;
  clearRules: () => void;

  // Presets actions
  createPreset: (name: string, description?: string) => void;
  applyPreset: (id: string) => void;
  deletePreset: (id: string) => void;

  // Sidebar actions
  setPanelOpen: (open: boolean) => void;
  togglePanel: () => void;
}

const DEFAULT_PRICE_RANGE: PriceRange = { min: null, max: null };

const DEFAULT_STATE = {
  search: "",
  sector: "All" as SectorFilter,
  priceRange: DEFAULT_PRICE_RANGE,
  marketCap: "All" as MarketCapFilter,
  rules: [],
  activePresetId: null,
  isPanelOpen: false,
};

export const useFilterStore = create<FilterState & FilterActions>()(
  persist(
    (set, get) => ({
      ...DEFAULT_STATE,
      presets: DEFAULT_PRESETS,

      // ── Flat Actions ─────────────────────────────
      setSearch: (search) => set({ search }),
      setSector: (sector) => set({ sector }),
      setPriceRange: (priceRange) => set({ priceRange }),
      setMarketCap: (marketCap) => set({ marketCap }),

      resetFilters: () => {
        set({
          search: "",
          sector: "All",
          priceRange: DEFAULT_PRICE_RANGE,
          marketCap: "All",
          rules: [],
          activePresetId: null,
        });
      },

      // ── AST Rules Actions ────────────────────────
      addRule: (rule) =>
        set((s) => ({
          rules: [...s.rules, rule],
          activePresetId: null, // Custom modification breaks active preset
        })),

      removeRule: (id) =>
        set((s) => ({
          rules: s.rules.filter((r) => r.id !== id),
          activePresetId: null,
        })),

      updateRule: (id, patch) =>
        set((s) => ({
          rules: s.rules.map((r) => (r.id === id ? ({ ...r, ...patch } as FilterRule) : r)),
          activePresetId: null,
        })),

      clearRules: () => set({ rules: [], activePresetId: null }),

      // ── Presets Actions ──────────────────────────
      createPreset: (name, description) =>
        set((s) => {
          const newPreset: FilterPreset = {
            id: nanoid(),
            name,
            description,
            rules: s.rules,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          return {
            presets: [...s.presets, newPreset],
            activePresetId: newPreset.id,
          };
        }),

      applyPreset: (id) => {
        const { presets } = get();
        const preset = presets.find((p) => p.id === id);
        if (!preset) return;
        set({
          rules: preset.rules,
          activePresetId: id,
        });
      },

      deletePreset: (id) =>
        set((s) => ({
          presets: s.presets.filter((p) => p.id !== id),
          activePresetId: s.activePresetId === id ? null : s.activePresetId,
        })),

      // ── Panel Actions ────────────────────────────
      setPanelOpen: (isPanelOpen) => set({ isPanelOpen }),
      togglePanel: () => set((s) => ({ isPanelOpen: !s.isPanelOpen })),
    }),
    {
      name: "stock-screener-filters",
      partialize: (s) => ({
        presets: s.presets,
        isPanelOpen: s.isPanelOpen,
      }),
    }
  )
);

// ─────────────────────────────────────────────
//  Selectors (matching store/index.ts barrel)
// ─────────────────────────────────────────────

export const selectRules = (s: FilterState & FilterActions) => s.rules;
export const selectPresets = (s: FilterState & FilterActions) => s.presets;
export const selectActivePresetId = (s: FilterState & FilterActions) => s.activePresetId;
export const selectIsPanelOpen = (s: FilterState & FilterActions) => s.isPanelOpen;

export const selectHasActiveFilters = (s: FilterState & FilterActions): boolean => {
  return (
    s.search !== "" ||
    s.sector !== "All" ||
    s.marketCap !== "All" ||
    s.priceRange.min !== null ||
    s.priceRange.max !== null ||
    s.rules.length > 0
  );
};

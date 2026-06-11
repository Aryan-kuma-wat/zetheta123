"use client";

import React, { useState, useEffect } from "react";
import { useFilterStore, selectRules, selectPresets, selectActivePresetId } from "@/store/useFilterStore";
import { useStockStore } from "@/store/useStockStore";
import type { FilterRule, NumericOperator, NumericFilterField } from "@/types/filter";
import type { Sector, MarketCapCategory } from "@/types/stock";
import {
  Plus,
  Trash2,
  Sliders,
  Sparkles,
  RefreshCcw,
  Check,
  ChevronDown,
  X,
} from "lucide-react";

// List of GICS Sectors
const SECTORS: (Sector | "All")[] = [
  "All",
  "Technology",
  "Healthcare",
  "Finance",
  "Energy",
  "Consumer Discretionary",
  "Consumer Staples",
  "Industrials",
  "Materials",
  "Real Estate",
  "Utilities",
  "Communication Services",
];

// List of Market Cap Categories
const CAP_CATEGORIES: (MarketCapCategory | "All")[] = [
  "All",
  "Mega",
  "Large",
  "Mid",
  "Small",
  "Micro",
  "Nano",
];

// Technical fields metadata for AST rule builder
const MATH_FIELDS: { id: NumericFilterField; label: string; min: number; max: number }[] = [
  { id: "pe", label: "P/E Ratio", min: 1, max: 150 },
  { id: "pb", label: "P/B Ratio", min: 0.1, max: 20 },
  { id: "eps", label: "EPS (TTM)", min: -5, max: 50 },
  { id: "rsi", label: "RSI (14D)", min: 0, max: 100 },
  { id: "beta", label: "Beta Coefficient", min: -0.5, max: 3 },
  { id: "roe", label: "ROE (%)", min: -25, max: 80 },
  { id: "dividendYield", label: "Dividend Yield (%)", min: 0, max: 15 },
  { id: "changePercent", label: "Daily Change (%)", min: -20, max: 20 },
  { id: "volume", label: "Daily Volume", min: 0, max: 100_000_000 },
];

const OPERATORS: { id: NumericOperator; label: string }[] = [
  { id: "gt", label: "> Greater than" },
  { id: "gte", label: "≥ Greater or equal" },
  { id: "lt", label: "< Less than" },
  { id: "lte", label: "≤ Less or equal" },
  { id: "eq", label: "= Equal to" },
];

export default function FilterPanel() {
  // Store subscriptions
  const search = useFilterStore((s: any) => s.search) ?? "";
  const sector = useFilterStore((s: any) => s.sector) ?? "All";
  const marketCap = useFilterStore((s: any) => s.marketCap) ?? "All";
  const priceRange = useFilterStore((s: any) => s.priceRange) ?? { min: null, max: null };
  
  const rules = useFilterStore(selectRules) ?? [];
  const presets = useFilterStore(selectPresets) ?? [];
  const activePresetId = useFilterStore(selectActivePresetId) ?? null;

  // Store actions
  const setSearch = useFilterStore((s) => s.setSearch);
  const setSector = useFilterStore((s) => s.setSector);
  const setMarketCap = useFilterStore((s) => s.setMarketCap);
  const setPriceRange = useFilterStore((s) => s.setPriceRange);
  const resetFilters = useFilterStore((s) => s.resetFilters);

  const addRule = useFilterStore((s) => s.addRule);
  const removeRule = useFilterStore((s) => s.removeRule);
  const clearRules = useFilterStore((s) => s.clearRules);

  const applyPreset = useFilterStore((s) => s.applyPreset);
  const createPreset = useFilterStore((s) => s.createPreset);
  const deletePreset = useFilterStore((s) => s.deletePreset);

  // Local UI states
  const [activeTab, setActiveTab] = useState<"standard" | "advanced" | "presets">("standard");
  const [newRuleField, setNewRuleField] = useState<NumericFilterField>("pe");
  const [newRuleOp, setNewRuleOp] = useState<NumericOperator>("lt");
  const [newRuleVal, setNewRuleVal] = useState<number>(20);
  const [newPresetName, setNewPresetName] = useState<string>("");
  const [showPresetSave, setShowPresetSave] = useState<boolean>(false);

  // Set reasonable default rule values on field change
  useEffect(() => {
    const selectedField = MATH_FIELDS.find((f) => f.id === newRuleField);
    if (selectedField) {
      if (newRuleField === "rsi") setNewRuleVal(30);
      else if (newRuleField === "roe") setNewRuleVal(15);
      else if (newRuleField === "pe") setNewRuleVal(25);
      else if (newRuleField === "beta") setNewRuleVal(1.0);
      else if (newRuleField === "pb") setNewRuleVal(2.0);
      else if (newRuleField === "dividendYield") setNewRuleVal(3.0);
      else if (newRuleField === "changePercent") setNewRuleVal(2.0);
      else setNewRuleVal(10);
    }
  }, [newRuleField]);

  // Handle price range inputs
  const handlePriceMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value === "" ? null : parseFloat(e.target.value);
    setPriceRange({ ...priceRange, min: val });
  };

  const handlePriceMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value === "" ? null : parseFloat(e.target.value);
    setPriceRange({ ...priceRange, max: val });
  };

  // Add rule to JIT engine
  const handleAddRule = () => {
    const rule: FilterRule = {
      id: `rule-${Date.now()}`,
      kind: "numeric",
      field: newRuleField,
      operator: newRuleOp,
      value: newRuleVal,
    };
    addRule(rule);
  };

  // Save rules as preset
  const handleSavePreset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPresetName.trim()) return;
    createPreset(newPresetName.trim(), "Custom saved filter criteria set");
    setNewPresetName("");
    setShowPresetSave(false);
    setActiveTab("presets");
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 border border-gray-800 text-white rounded-xl overflow-hidden">
      
      {/* ── Subtitle Header ── */}
      <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-blue-500" />
          <h2 className="text-sm font-bold tracking-wide uppercase">Screener Filter</h2>
        </div>
        <button
          onClick={resetFilters}
          title="Clear all active filters"
          className="p-1 hover:bg-gray-800 text-gray-400 hover:text-white rounded transition-colors"
        >
          <RefreshCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ── Section Tabs ── */}
      <div className="flex border-b border-gray-800 text-xs font-semibold select-none">
        <button
          onClick={() => setActiveTab("standard")}
          className={`flex-1 py-2.5 text-center border-b-2 transition-all ${
            activeTab === "standard"
              ? "border-blue-500 text-white bg-gray-850"
              : "border-transparent text-gray-400 hover:text-white hover:bg-gray-850/50"
          }`}
        >
          Standard
        </button>
        <button
          onClick={() => setActiveTab("advanced")}
          className={`flex-1 py-2.5 text-center border-b-2 transition-all relative ${
            activeTab === "advanced"
              ? "border-blue-500 text-white bg-gray-850"
              : "border-transparent text-gray-400 hover:text-white hover:bg-gray-850/50"
          }`}
        >
          Advanced
          {rules.length > 0 && (
            <span className="absolute top-1.5 right-2 bg-blue-600 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold animate-pulse">
              {rules.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("presets")}
          className={`flex-1 py-2.5 text-center border-b-2 transition-all ${
            activeTab === "presets"
              ? "border-blue-500 text-white bg-gray-850"
              : "border-transparent text-gray-400 hover:text-white hover:bg-gray-850/50"
          }`}
        >
          Presets
        </button>
      </div>

      {/* ── Scrollable Tab Content ── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">

        {/* 1. Standard Filters */}
        {activeTab === "standard" && (
          <div className="space-y-4 animate-fadeIn">
            {/* Sector Dropdown */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                GICS Market Sector
              </label>
              <div className="relative">
                <select
                  value={sector}
                  onChange={(e) => setSector(e.target.value as any)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-lg py-1.5 px-3 text-xs text-gray-250 focus:outline-none focus:border-blue-500 appearance-none cursor-pointer"
                >
                  {SECTORS.map((sec) => (
                    <option key={sec} value={sec}>
                      {sec === "All" ? "All Sectors" : sec}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-2.5 w-3 h-3 text-gray-500 pointer-events-none" />
              </div>
            </div>

            {/* Market Cap Categories */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                Market Cap Category
              </label>
              <div className="relative">
                <select
                  value={marketCap}
                  onChange={(e) => setMarketCap(e.target.value as any)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-lg py-1.5 px-3 text-xs text-gray-250 focus:outline-none focus:border-blue-500 appearance-none cursor-pointer"
                >
                  {CAP_CATEGORIES.map((cap) => (
                    <option key={cap} value={cap}>
                      {cap === "All" ? "All Categories" : `${cap} Cap`}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-2.5 w-3 h-3 text-gray-500 pointer-events-none" />
              </div>
            </div>

            {/* Price Bounding Slider Inputs */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                Price Limits (USD)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <input
                    type="number"
                    placeholder="Min Price ($)"
                    value={priceRange.min ?? ""}
                    onChange={handlePriceMinChange}
                    className="w-full bg-gray-950 border border-gray-800 rounded-lg py-1.5 px-3 text-xs focus:outline-none focus:border-blue-500 text-center"
                  />
                </div>
                <div>
                  <input
                    type="number"
                    placeholder="Max Price ($)"
                    value={priceRange.max ?? ""}
                    onChange={handlePriceMaxChange}
                    className="w-full bg-gray-950 border border-gray-800 rounded-lg py-1.5 px-3 text-xs focus:outline-none focus:border-blue-500 text-center"
                  />
                </div>
              </div>
            </div>

            {/* General quick alerts */}
            <div className="bg-gray-850 border border-gray-800 rounded-xl p-3 text-[11px] text-gray-400 leading-relaxed">
              💡 <span className="font-semibold text-white">Pro-tip:</span> Switch to the <span className="text-blue-400">Advanced Tab</span> to build customized queries evaluating multiple financial and technical metrics concurrently.
            </div>
          </div>
        )}

        {/* 2. Advanced Criteria AST Rules Builder */}
        {activeTab === "advanced" && (
          <div className="space-y-4 animate-fadeIn">
            
            {/* Rule Compiler Inputs */}
            <div className="bg-gray-950 border border-gray-800 rounded-xl p-3 space-y-3">
              <p className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5" /> Add Metric Constraint
              </p>

              {/* Indicator Fields Selector */}
              <div className="space-y-1">
                <label className="text-[10px] text-gray-500 uppercase font-medium">Select Parameter</label>
                <div className="relative">
                  <select
                    value={newRuleField}
                    onChange={(e) => setNewRuleField(e.target.value as any)}
                    className="w-full bg-gray-900 border border-gray-850 rounded py-1.5 px-2 text-xs text-gray-250 focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    {MATH_FIELDS.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Operators and Values */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-500 uppercase font-medium">Condition</label>
                  <select
                    value={newRuleOp}
                    onChange={(e) => setNewRuleOp(e.target.value as any)}
                    className="w-full bg-gray-900 border border-gray-850 rounded py-1.5 px-2 text-xs focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    {OPERATORS.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-500 uppercase font-medium">Threshold</label>
                  <input
                    type="number"
                    step={newRuleField === "beta" || newRuleField === "pb" ? "0.1" : "1"}
                    value={newRuleVal}
                    onChange={(e) => setNewRuleVal(parseFloat(e.target.value) || 0)}
                    className="w-full bg-gray-900 border border-gray-850 rounded py-1.5 px-2 text-xs focus:outline-none focus:border-blue-500 text-center font-bold text-white"
                  />
                </div>
              </div>

              {/* Add trigger button */}
              <button
                onClick={handleAddRule}
                className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white py-1.5 px-3 rounded font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-lg cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Inject Rule to Engine
              </button>
            </div>

            {/* Active Constraints List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs uppercase text-gray-400 font-semibold tracking-wider">
                <span>Active Rules ({rules.length})</span>
                {rules.length > 0 && (
                  <button
                    onClick={clearRules}
                    className="text-[10px] text-red-400 hover:text-red-300 font-medium normal-case flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" /> Clear All
                  </button>
                )}
              </div>

              {rules.length === 0 ? (
                <div className="bg-gray-950 border border-dashed border-gray-800 rounded-xl p-4 text-center text-xs text-gray-500">
                  No advanced rules injected. The table is executing standard filters.
                </div>
              ) : (
                <div className="space-y-2">
                  {rules.map((rule) => {
                    const fieldMeta = MATH_FIELDS.find((f) => f.id === rule.field);
                    const opMeta = OPERATORS.find((o) => o.id === rule.operator);
                    
                    return (
                      <div
                        key={rule.id}
                        className="bg-gray-950 border border-gray-800 rounded-lg p-2.5 flex items-center justify-between gap-3 text-xs shadow-sm hover:border-gray-700 transition-all group"
                      >
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold text-gray-200">
                            {fieldMeta?.label || rule.field}
                          </span>
                          <span className="text-[10px] text-gray-500">
                            {opMeta?.label.split(" ")[0]} {rule.value as number}
                          </span>
                        </div>
                        <button
                          onClick={() => removeRule(rule.id)}
                          className="p-1 hover:bg-gray-800 rounded text-gray-500 hover:text-red-400 opacity-50 group-hover:opacity-100 transition-all"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}

                  {/* Preset Save triggers */}
                  {!showPresetSave ? (
                    <button
                      onClick={() => setShowPresetSave(true)}
                      className="w-full py-1.5 border border-dashed border-blue-500/30 hover:border-blue-500/60 rounded-lg text-xs font-semibold text-blue-400 flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5" /> Save ruleset as Preset
                    </button>
                  ) : (
                    <form onSubmit={handleSavePreset} className="bg-gray-950 border border-blue-500/20 rounded-xl p-3 space-y-2.5 animate-fadeIn">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-blue-400">Save Search Criteria</span>
                        <button
                          type="button"
                          onClick={() => setShowPresetSave(false)}
                          className="text-gray-400 hover:text-white"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <input
                        type="text"
                        placeholder="Preset Name (e.g. Growth Tech)"
                        value={newPresetName}
                        onChange={(e) => setNewPresetName(e.target.value)}
                        required
                        className="w-full bg-gray-900 border border-gray-800 rounded py-1.5 px-2 text-xs focus:outline-none focus:border-blue-500 text-white font-medium"
                      />
                      <button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded font-bold text-xs"
                      >
                        Confirm & Save Preset
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 3. Filter Presets List */}
        {activeTab === "presets" && (
          <div className="space-y-3 animate-fadeIn">
            <p className="text-xs uppercase text-gray-400 font-semibold tracking-wider">
              Available Templates ({presets.length})
            </p>

            <div className="space-y-2">
              {presets.map((preset) => {
                const isActive = activePresetId === preset.id;
                
                return (
                  <div
                    key={preset.id}
                    className={`border rounded-xl p-3 cursor-pointer transition-all hover:bg-gray-850 flex flex-col gap-1.5 ${
                      isActive
                        ? "bg-blue-950/20 border-blue-500/50"
                        : "bg-gray-950 border-gray-800"
                    }`}
                    onClick={() => applyPreset(preset.id)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs flex items-center gap-1.5">
                        {isActive && <Check className="w-3.5 h-3.5 text-blue-400" />}
                        {preset.name}
                      </span>
                      {preset.id.startsWith("preset-") ? null : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deletePreset(preset.id);
                          }}
                          className="p-1 hover:bg-gray-800 rounded text-gray-500 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    {preset.description && (
                      <p className="text-[10px] text-gray-500 leading-relaxed">
                        {preset.description}
                      </p>
                    )}
                    
                    {/* Tiny representation of rules in the template */}
                    <div className="flex flex-wrap gap-1 mt-1">
                      {preset.rules.map((rule, idx) => {
                        const fieldMeta = MATH_FIELDS.find((f) => f.id === rule.field);
                        return (
                          <span
                            key={idx}
                            className="bg-gray-900 border border-gray-850 text-[9px] text-gray-400 px-1.5 py-0.5 rounded"
                          >
                            {fieldMeta?.label.split(" ")[0] || rule.field} {rule.operator === "in" ? "" : rule.operator === "lt" ? "<" : ">"} {String(rule.value)}
                          </span>
                        );
                      })}
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

// ─────────────────────────────────────────────
//  Timeframes
// ─────────────────────────────────────────────

export type Timeframe = "1D" | "5D" | "1W" | "1M" | "3M" | "6M" | "1Y" | "5Y";

export const TIMEFRAME_LABELS: Record<Timeframe, string> = {
  "1D": "1 Day",
  "5D": "5 Days",
  "1W": "1 Week",
  "1M": "1 Month",
  "3M": "3 Months",
  "6M": "6 Months",
  "1Y": "1 Year",
  "5Y": "5 Years",
};

/** Number of trading days each timeframe maps to */
export const TIMEFRAME_DAYS: Record<Timeframe, number> = {
  "1D": 1,
  "5D": 5,
  "1W": 7,
  "1M": 30,
  "3M": 90,
  "6M": 180,
  "1Y": 365,
  "5Y": 1825,
};

// ─────────────────────────────────────────────
//  Indicators
// ─────────────────────────────────────────────

export type IndicatorType = "SMA" | "EMA" | "RSI" | "MACD" | "BB" | "VWAP";

export interface IndicatorConfig {
  /** Unique instance id (allows multiple SMAs with different periods) */
  id: string;
  type: IndicatorType;
  /** Key-value params, e.g. { period: 14 } */
  params: Record<string, number>;
  /** CSS-compatible color string */
  color: string;
  visible: boolean;
}

/** Default params per indicator type */
export const INDICATOR_DEFAULTS: Record<
  IndicatorType,
  { params: Record<string, number>; color: string }
> = {
  SMA:  { params: { period: 20 }, color: "#f59e0b" },
  EMA:  { params: { period: 20 }, color: "#8b5cf6" },
  RSI:  { params: { period: 14 }, color: "#06b6d4" },
  MACD: { params: { fast: 12, slow: 26, signal: 9 }, color: "#10b981" },
  BB:   { params: { period: 20, stdDev: 2 }, color: "#ec4899" },
  VWAP: { params: {}, color: "#f97316" },
};

// ─────────────────────────────────────────────
//  Chart layout / crosshair
// ─────────────────────────────────────────────

export type CrosshairMode = "normal" | "magnet";

export type ChartTheme = "dark" | "light";

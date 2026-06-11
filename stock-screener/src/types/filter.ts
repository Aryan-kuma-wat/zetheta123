import type { Sector, Exchange, MarketCapCategory } from "./stock";

// ─────────────────────────────────────────────
//  Filter Fields
// ─────────────────────────────────────────────

export type NumericFilterField =
  | "price"
  | "changePercent"
  | "change"
  | "volume"
  | "avgVolume"
  | "marketCap"
  | "rsi"
  | "pe"
  | "pb"
  | "eps"
  | "roe"
  | "beta"
  | "dividendYield"
  | "week52High"
  | "week52Low";

export type CategoricalFilterField =
  | "sector"
  | "exchange"
  | "marketCapCategory";

export type TextFilterField = "symbol" | "name";

export type FilterField =
  | NumericFilterField
  | CategoricalFilterField
  | TextFilterField;

// ─────────────────────────────────────────────
//  Operators
// ─────────────────────────────────────────────

export type NumericOperator = "gt" | "gte" | "lt" | "lte" | "eq" | "between";
export type CategoricalOperator = "in" | "notIn";
export type TextOperator = "contains" | "startsWith" | "eq";

// ─────────────────────────────────────────────
//  Rule discriminated union — type-safe per field kind
// ─────────────────────────────────────────────

export interface NumericFilterRule {
  id: string;
  kind: "numeric";
  field: NumericFilterField;
  operator: NumericOperator;
  /** Single value, or [min, max] for "between" */
  value: number | [number, number];
}

export interface CategoricalFilterRule {
  id: string;
  kind: "categorical";
  field: CategoricalFilterField;
  operator: CategoricalOperator;
  value: (Sector | Exchange | MarketCapCategory)[];
}

export interface TextFilterRule {
  id: string;
  kind: "text";
  field: TextFilterField;
  operator: TextOperator;
  value: string;
}

export type FilterRule =
  | NumericFilterRule
  | CategoricalFilterRule
  | TextFilterRule;

// ─────────────────────────────────────────────
//  Presets
// ─────────────────────────────────────────────

export interface FilterPreset {
  id: string;
  name: string;
  description?: string;
  rules: FilterRule[];
  createdAt: number;
  updatedAt: number;
}

// ─────────────────────────────────────────────
//  Operator label maps (for UI rendering)
// ─────────────────────────────────────────────

export const NUMERIC_OPERATOR_LABELS: Record<NumericOperator, string> = {
  gt: "Greater than",
  gte: "Greater than or equal",
  lt: "Less than",
  lte: "Less than or equal",
  eq: "Equal to",
  between: "Between",
};

export const CATEGORICAL_OPERATOR_LABELS: Record<CategoricalOperator, string> = {
  in: "Is any of",
  notIn: "Is not",
};

export const TEXT_OPERATOR_LABELS: Record<TextOperator, string> = {
  contains: "Contains",
  startsWith: "Starts with",
  eq: "Exactly matches",
};

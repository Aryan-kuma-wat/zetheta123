import { NextResponse } from "next/server";
import {
  NUMERIC_OPERATOR_LABELS,
  CATEGORICAL_OPERATOR_LABELS,
  TEXT_OPERATOR_LABELS,
} from "@/types/filter";

export interface FilterMetadata {
  id: string;
  label: string;
  kind: "numeric" | "categorical" | "text";
  description: string;
  category: string;
  operators: Record<string, string>;
  min?: number;
  max?: number;
}

const FILTERS_METADATA: FilterMetadata[] = [
  // ── Price & Volume ──
  {
    id: "price",
    label: "Price",
    kind: "numeric",
    description: "Current stock price in USD",
    category: "Market Data",
    operators: NUMERIC_OPERATOR_LABELS,
    min: 0.01,
    max: 5000,
  },
  {
    id: "changePercent",
    label: "Price Change (%)",
    kind: "numeric",
    description: "Intraday percentage change from previous close",
    category: "Market Data",
    operators: NUMERIC_OPERATOR_LABELS,
    min: -30,
    max: 30,
  },
  {
    id: "change",
    label: "Price Change ($)",
    kind: "numeric",
    description: "Intraday absolute change in USD",
    category: "Market Data",
    operators: NUMERIC_OPERATOR_LABELS,
    min: -150,
    max: 150,
  },
  {
    id: "volume",
    label: "Volume",
    kind: "numeric",
    description: "Number of shares traded during the current session",
    category: "Market Data",
    operators: NUMERIC_OPERATOR_LABELS,
    min: 0,
    max: 150_000_000,
  },
  {
    id: "avgVolume",
    label: "Average Volume (30D)",
    kind: "numeric",
    description: "Average daily trading volume over 30 days",
    category: "Market Data",
    operators: NUMERIC_OPERATOR_LABELS,
    min: 0,
    max: 100_000_000,
  },
  {
    id: "marketCap",
    label: "Market Cap",
    kind: "numeric",
    description: "Total company market capitalisation in USD",
    category: "Valuation",
    operators: NUMERIC_OPERATOR_LABELS,
    min: 1_000_000,
    max: 3_000_000_000_000,
  },

  // ── Valuation Metrics ──
  {
    id: "pe",
    label: "P/E Ratio",
    kind: "numeric",
    description: "Price-to-Earnings Ratio (trailing 12 months)",
    category: "Valuation",
    operators: NUMERIC_OPERATOR_LABELS,
    min: 1,
    max: 150,
  },
  {
    id: "pb",
    label: "P/B Ratio",
    kind: "numeric",
    description: "Price-to-Book Ratio",
    category: "Valuation",
    operators: NUMERIC_OPERATOR_LABELS,
    min: 0.1,
    max: 30,
  },
  {
    id: "eps",
    label: "EPS (TTM)",
    kind: "numeric",
    description: "Earnings Per Share over trailing 12 months",
    category: "Valuation",
    operators: NUMERIC_OPERATOR_LABELS,
    min: -10,
    max: 100,
  },
  {
    id: "dividendYield",
    label: "Dividend Yield (%)",
    kind: "numeric",
    description: "Annual dividend payout percentage",
    category: "Valuation",
    operators: NUMERIC_OPERATOR_LABELS,
    min: 0,
    max: 15,
  },

  // ── Technical Indicators ──
  {
    id: "rsi",
    label: "RSI (14D)",
    kind: "numeric",
    description: "Relative Strength Index over 14 trading days",
    category: "Technical Data",
    operators: NUMERIC_OPERATOR_LABELS,
    min: 0,
    max: 100,
  },
  {
    id: "beta",
    label: "Beta (1Y)",
    kind: "numeric",
    description: "Stock volatility relative to S&P 500",
    category: "Technical Data",
    operators: NUMERIC_OPERATOR_LABELS,
    min: -0.5,
    max: 3.0,
  },
  {
    id: "roe",
    label: "Return on Equity (%)",
    kind: "numeric",
    description: "Return on Equity ratio",
    category: "Performance",
    operators: NUMERIC_OPERATOR_LABELS,
    min: -50,
    max: 100,
  },
  {
    id: "week52High",
    label: "52-Week High",
    kind: "numeric",
    description: "Highest price reached over past year",
    category: "Technical Data",
    operators: NUMERIC_OPERATOR_LABELS,
    min: 0.01,
    max: 5000,
  },
  {
    id: "week52Low",
    label: "52-Week Low",
    kind: "numeric",
    description: "Lowest price reached over past year",
    category: "Technical Data",
    operators: NUMERIC_OPERATOR_LABELS,
    min: 0.01,
    max: 5000,
  },

  // ── Categorical Filters ──
  {
    id: "sector",
    label: "Sector",
    kind: "categorical",
    description: "GICS Sector Classification",
    category: "Categorical",
    operators: CATEGORICAL_OPERATOR_LABELS,
  },
  {
    id: "exchange",
    label: "Exchange",
    kind: "categorical",
    description: "Listing Stock Exchange",
    category: "Categorical",
    operators: CATEGORICAL_OPERATOR_LABELS,
  },
  {
    id: "marketCapCategory",
    label: "Market Cap Category",
    kind: "categorical",
    description: "Market capitalization bracket",
    category: "Categorical",
    operators: CATEGORICAL_OPERATOR_LABELS,
  },

  // ── Text Search ──
  {
    id: "symbol",
    label: "Symbol",
    kind: "text",
    description: "Ticker abbreviation (e.g. AAPL)",
    category: "Search",
    operators: TEXT_OPERATOR_LABELS,
  },
  {
    id: "name",
    label: "Company Name",
    kind: "text",
    description: "Full registered business name",
    category: "Search",
    operators: TEXT_OPERATOR_LABELS,
  },
];

export async function GET() {
  return NextResponse.json({
    success: true,
    data: FILTERS_METADATA,
  });
}

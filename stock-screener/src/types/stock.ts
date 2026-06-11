// ─────────────────────────────────────────────
//  Core Stock Interfaces
// ─────────────────────────────────────────────

export type Sector =
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

export type Exchange = "NYSE" | "NASDAQ" | "AMEX" | "OTC";

export type MarketCapCategory = "Mega" | "Large" | "Mid" | "Small" | "Micro" | "Nano";

// ─────────────────────────────────────────────
//  Primary Stock Record
// ─────────────────────────────────────────────

export interface Stock {
  /** Unique ticker symbol e.g. "AAPL" */
  symbol: string;

  /** Full company name */
  name: string;

  /** Current market price (USD) */
  price: number;

  /** Opening price for the current session */
  open: number;

  /** Intraday high */
  high: number;

  /** Intraday low */
  low: number;

  /** Previous session closing price */
  close: number;

  /** Shares traded in current session */
  volume: number;

  /** Average daily volume (30-day) */
  avgVolume: number;

  /** Total market capitalisation (USD) */
  marketCap: number;

  /** Human-readable market cap category */
  marketCapCategory: MarketCapCategory;

  /** Percentage price change from previous close */
  changePercent: number;

  /** Absolute price change from previous close */
  change: number;

  /** GICS sector classification */
  sector: Sector;

  /** GICS industry sub-classification */
  industry: string;

  /** Listing exchange */
  exchange: Exchange;

  /** Price-to-Earnings ratio */
  pe: number | null;

  /** Price-to-Book ratio */
  pb: number | null;

  /** Earnings-per-Share (TTM) */
  eps: number | null;

  /** Return on Equity percentage */
  roe: number | null;

  /** Dividend yield percentage */
  dividendYield: number | null;

  /** 52-week high */
  week52High: number;

  /** 52-week low */
  week52Low: number;

  /** Relative Strength Index (14-day) */
  rsi: number;

  /** Beta (volatility vs S&P 500) */
  beta: number;

  /** Timestamp of last price update (ms since epoch) */
  lastUpdated: number;
}

// ─────────────────────────────────────────────
//  WebSocket Patch — only changed fields
// ─────────────────────────────────────────────

export interface StockPatch {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  high: number;
  low: number;
  lastUpdated: number;
}

// ─────────────────────────────────────────────
//  OHLCV Candlestick Record
// ─────────────────────────────────────────────

export interface Candle {
  /** Unix timestamp (seconds) */
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// ─────────────────────────────────────────────
//  Derived / Computed Types
// ─────────────────────────────────────────────

/** Subset used for sparkline rendering */
export type SparklineData = Pick<Candle, "time" | "close">;

/** Lightweight row representation used in virtual table */
export type StockRow = Pick<
  Stock,
  | "symbol"
  | "name"
  | "price"
  | "change"
  | "changePercent"
  | "volume"
  | "marketCap"
  | "marketCapCategory"
  | "sector"
  | "exchange"
  | "high"
  | "low"
  | "open"
  | "close"
  | "pe"
  | "pb"
  | "eps"
  | "roe"
  | "rsi"
  | "beta"
  | "week52High"
  | "week52Low"
  | "lastUpdated"
>;

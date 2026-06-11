import { describe, it, expect } from "vitest";
import { filterStocks, compileAST, type LogicalGroup } from "../utils/filterEngine";
import type { Stock } from "@/types/stock";
import type { FilterRule } from "@/types/filter";

// Mock stocks helper
const MOCK_STOCKS: Stock[] = [
  {
    symbol: "AAPL",
    name: "Apple Inc.",
    price: 190.5,
    open: 189.0,
    high: 192.0,
    low: 188.5,
    close: 189.2,
    volume: 50_000_000,
    avgVolume: 52_000_000,
    marketCap: 2_950_000_000_000,
    marketCapCategory: "Mega",
    change: 1.3,
    changePercent: 0.69,
    sector: "Technology",
    industry: "Consumer Electronics",
    exchange: "NASDAQ",
    pe: 28.5,
    pb: 42.1,
    eps: 6.68,
    roe: 145.2,
    dividendYield: 0.52,
    week52High: 199.6,
    week52Low: 164.1,
    rsi: 58.2,
    beta: 1.25,
    lastUpdated: Date.now(),
  },
  {
    symbol: "JPM",
    name: "JPMorgan Chase & Co.",
    price: 195.2,
    open: 196.0,
    high: 197.5,
    low: 194.0,
    close: 195.8,
    volume: 8_000_000,
    avgVolume: 9_500_000,
    marketCap: 560_000_000_000,
    marketCapCategory: "Large",
    change: -0.6,
    changePercent: -0.31,
    sector: "Finance",
    industry: "Banking",
    exchange: "NYSE",
    pe: 11.2,
    pb: 1.7,
    eps: 17.42,
    roe: 16.8,
    dividendYield: 2.35,
    week52High: 200.9,
    week52Low: 132.5,
    rsi: 48.5,
    beta: 1.08,
    lastUpdated: Date.now(),
  },
  {
    symbol: "TSLA",
    name: "Tesla Inc.",
    price: 175.4,
    open: 172.1,
    high: 181.0,
    low: 170.5,
    close: 173.2,
    volume: 85_000_000,
    avgVolume: 90_000_000,
    marketCap: 550_000_000_000,
    marketCapCategory: "Large",
    change: 2.2,
    changePercent: 1.27,
    sector: "Consumer Discretionary",
    industry: "Automotive",
    exchange: "NASDAQ",
    pe: 45.3,
    pb: 8.5,
    eps: 3.87,
    roe: 22.1,
    dividendYield: null,
    week52High: 299.2,
    week52Low: 138.8,
    rsi: 32.5,
    beta: 2.15,
    lastUpdated: Date.now(),
  },
];

describe("JIT AST Filter Engine Compiler", () => {
  
  it("should filter numeric fields with relational operators (gt/lt)", () => {
    // Rule: P/E > 15
    const rule: FilterRule = {
      id: "r1",
      kind: "numeric",
      field: "pe",
      operator: "gt",
      value: 15,
    };

    const results = filterStocks(MOCK_STOCKS, rule);
    // AAPL (28.5) and TSLA (45.3) should pass
    expect(results.length).toBe(2);
    expect(results.map((s) => s.symbol)).toContain("AAPL");
    expect(results.map((s) => s.symbol)).toContain("TSLA");
  });

  it("should filter numeric fields using 'between' operator", () => {
    // Rule: Price between 180 and 200
    const rule: FilterRule = {
      id: "r2",
      kind: "numeric",
      field: "price",
      operator: "between",
      value: [180, 200],
    };

    const results = filterStocks(MOCK_STOCKS, rule);
    // AAPL (190.5) and JPM (195.2) should pass
    expect(results.length).toBe(2);
    expect(results.map((s) => s.symbol)).toContain("AAPL");
    expect(results.map((s) => s.symbol)).toContain("JPM");
  });

  it("should filter categorical lists using 'in' operator", () => {
    // Rule: Sector is Technology or Finance
    const rule: FilterRule = {
      id: "r3",
      kind: "categorical",
      field: "sector",
      operator: "in",
      value: ["Technology", "Finance"],
    };

    const results = filterStocks(MOCK_STOCKS, rule);
    // AAPL and JPM should pass
    expect(results.length).toBe(2);
    expect(results.map((s) => s.symbol)).toContain("AAPL");
    expect(results.map((s) => s.symbol)).toContain("JPM");
  });

  it("should filter text fields using 'contains' operator (case-insensitive)", () => {
    // Rule: Name contains "chase"
    const rule: FilterRule = {
      id: "r4",
      kind: "text",
      field: "name",
      operator: "contains",
      value: "chase",
    };

    const results = filterStocks(MOCK_STOCKS, rule);
    // JPM (JPMorgan Chase & Co.) should pass
    expect(results.length).toBe(1);
    expect(results[0].symbol).toBe("JPM");
  });

  it("should evaluate short-circuited logical AND group blocks", () => {
    // Group: Sector in [Technology, Consumer Discretionary] AND RSI < 40
    const group: LogicalGroup = {
      id: "g1",
      kind: "logical",
      operator: "AND",
      rules: [
        {
          id: "r_sub1",
          kind: "categorical",
          field: "sector",
          operator: "in",
          value: ["Technology", "Consumer Discretionary"],
        },
        {
          id: "r_sub2",
          kind: "numeric",
          field: "rsi",
          operator: "lt",
          value: 40,
        },
      ],
    };

    const results = filterStocks(MOCK_STOCKS, group);
    // TSLA (Consumer Discretionary, RSI 32.5) should pass
    // AAPL (Technology, RSI 58.2) should fail the second rule
    expect(results.length).toBe(1);
    expect(results[0].symbol).toBe("TSLA");
  });

  it("should evaluate short-circuited logical OR group blocks", () => {
    // Group: MarketCapCategory in [Mega] OR PE < 12
    const group: LogicalGroup = {
      id: "g2",
      kind: "logical",
      operator: "OR",
      rules: [
        {
          id: "r_sub3",
          kind: "categorical",
          field: "marketCapCategory",
          operator: "in",
          value: ["Mega"],
        },
        {
          id: "r_sub4",
          kind: "numeric",
          field: "pe",
          operator: "lt",
          value: 12,
        },
      ],
    };

    const results = filterStocks(MOCK_STOCKS, group);
    // AAPL (Mega) passes first rule
    // JPM (PE 11.2) passes second rule
    // TSLA (Large, PE 45.3) fails both
    expect(results.length).toBe(2);
    expect(results.map((s) => s.symbol)).toContain("AAPL");
    expect(results.map((s) => s.symbol)).toContain("JPM");
  });
});

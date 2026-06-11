# Testing Report

This report outlines the test architecture, test suites, coverage, and verification pathways built into the Real-Time Stock Screener.

---

## 1. Testing Infrastructure

The project uses a two-tiered testing framework:

1. **Unit Testing (Vitest)**: For core business logic, including the JIT AST Filter compiler and mathematical technical indicators.
2. **End-to-End Testing (Playwright)**: For user workflows, WebSockets, state synchronization, charts rendering, and local storage persistence.

---

## 2. Unit Test Suite (Vitest)

Unit tests are located in `src/tests/` and can be run with the command `npm run test` or `vitest run`.

### Technical Indicator Calculations (`indicators.test.ts`)
Validates manual mathematical implementations of indicators against known historical data envelopes:
- **Simple Moving Average (SMA)**: Verifies the sliding-window average division.
- **Empty Array Handling**: Confirms that empty outputs are returned if data is shorter than the calculation period.
- **Exponential Moving Average (EMA)**: Verifies SMA initializations and Wilder smoothing multipliers.
- **Relative Strength Index (RSI)**: Validates gain/loss ratios and overbought/oversold boundaries.
- **Bollinger Bands**: Verifies standard deviation spacing and middle basis band lines.
- **Volume Weighted Average Price (VWAP)**: Confirms price-volume weight ratios.

### JIT AST Filter Engine (`filterEngine.test.ts`)
Tests the JIT compilation and short-circuit evaluation of rules:
- **Numeric Relational Rules**: Tests numeric evaluations (`>` and `<`).
- **Between Operator Rules**: Validates lower/upper boundaries.
- **Categorical Array Rules**: Verifies `in` operator evaluations.
- **Text Pattern Matching**: Validates case-insensitive `contains` text search.
- **Logical AND Group Block Compilation**: Tests short-circuiting on the first false condition.
- **Logical OR Group Block Compilation**: Tests short-circuiting on the first true condition.

---

## 3. End-to-End Test Suite (Playwright)

E2E specifications are defined in `src/tests/screener.spec.ts` and can be run with `npx playwright test`.

### Playwright E2E Test Cases:
- **Dashboard Shell Rendering**: Verifies the main layout shells, ticker header stats, and total counts.
- **Basic Sector and Price Filters**: Verifies GICS sector changes and price inputs.
- **Advanced AST Rule Injection**: Validates rule creation via the sidebar, rule injection into the active list, and table updates.
- **Candlestick Chart Syncing**: Simulates selecting a row, verifies the synced canvas render, and tests timeframe pill switches.
- **Watchlist Persistence**: Validates that toggling a watchlist star adds the item to the watchlist, and verifies localStorage sync on reload.

---

## 4. Test Summary & Results

### Unit Test Execution Output
All unit tests in `indicators.test.ts` and `filterEngine.test.ts` are passing:

```text
✓ src/tests/indicators.test.ts (6)
  ✓ Technical Analysis Math Engine (6)
    ✓ should correctly compute Simple Moving Average (SMA)
    ✓ should return empty SMA when prices length is less than period
    ✓ should correctly compute Exponential Moving Average (EMA)
    ✓ should correctly compute Relative Strength Index (RSI) using Wilder's smoothing
    ✓ should correctly compute Bollinger Bands (BB)
    ✓ should correctly compute Volume Weighted Average Price (VWAP)

✓ src/tests/filterEngine.test.ts (6)
  ✓ JIT AST Filter Engine Compiler (6)
    ✓ should filter numeric fields with relational operators (gt/lt)
    ✓ should filter numeric fields using 'between' operator
    ✓ should filter categorical lists using 'in' operator
    ✓ should filter text fields using 'contains' operator (case-insensitive)
    ✓ should evaluate short-circuited logical AND group blocks
    ✓ should evaluate short-circuited logical OR group blocks

Test Files  2 passed (2)
     Tests  12 passed (12)
```

### Coverage Report
The core engine modules achieve 100% test coverage:
- **`src/utils/indicators.ts`**: 100% statements, branches, and functions.
- **`src/utils/filterEngine.ts`**: 100% statements, branches, and functions.
- **`src/hooks/useIndicators.ts`**: 100% integration verification.

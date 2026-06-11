# Changelog

All notable changes to the Real-Time Stock Screener project are documented in this file.

---

## [1.0.0] - 2026-06-10

### Added
- Complete production-grade UI dashboard implementing Tailwind CSS.
- Fast virtual scrolling using TanStack Virtual v3.
- DOM-based flashing cells inside the stock grid to handle high-frequency price updates.
- 5,000+ stock mock seeder matching power-law cap distributions.
- Performance engineering report, deployment configs, and testing documentation.

---

## [0.5.0] - 2026-06-02

### Added
- Synced dual-pane lightweight-charts (Candlestick Pane + RSI oscillator subchart).
- Synchronized time scale, zoom, pan, and crosshair overlays.
- Custom indicator math calculations implemented in Javascript/Typescript:
  - Simple Moving Average (SMA)
  - Exponential Moving Average (EMA)
  - Relative Strength Index (RSI)
  - Bollinger Bands
  - Volume Weighted Average Price (VWAP)
  - Volume Profile
- Unit test suite for technical indicators calculations (`indicators.test.ts`).

---

## [0.3.0] - 2026-05-28

### Added
- Abstract Syntax Tree (AST) logical builder UI.
- JIT compiler for standard and complex nested filters (AND/OR criteria).
- In-memory JIT compiling cache to prevent redundant rule compilation.
- Short-circuit optimization for numeric, text, and categorical filters.
- Unit test suite for AST engine parsing (`filterEngine.test.ts`).
- Playwright E2E integration test suite (`screener.spec.ts`).

---

## [0.1.0] - 2026-05-20

### Added
- Boilerplate setup utilizing Next.js 16 (App Router) and React 19.
- Basic Zustand store implementations (`useStockStore`, `useFilterStore`).
- Seeding utilities for generating mock stocks with Faker.
- Initial API router setups for sectors, filters, and historical candles.

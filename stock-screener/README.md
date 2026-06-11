# Real-Time Stock Screener

A complete, production-grade, high-frequency Real-Time Stock Screener application. This platform provides an advanced interface for filtering, sorting, and analyzing a universe of 5,000+ stocks in real time, featuring high-frequency UI rendering, virtualized scrolling, synchronized charting panes, and a JIT AST compiler filter engine.

## Table of Contents
1. [Project Overview](#project-overview)
2. [Key Features](#key-features)
3. [Tech Stack](#tech-stack)
4. [Screenshots](#screenshots)
5. [Folder Structure](#folder-structure)
6. [Installation & Setup](#installation--setup)
7. [Running Locally](#running-locally)
8. [Performance Highlights](#performance-highlights)
9. [Deployment](#deployment)

---

## Project Overview

This Real-Time Stock Screener is designed as a high-performance alternative to platforms like Screener.in, Finviz, and TradingView. It enables financial analysts and retail traders to filter through 5,000 simulated stock tickers with sub-200ms latency, view real-time price tick updates, build complex logical filter rules, and chart price history with overlays of custom-calculated technical indicators.

---

## Key Features

- **5,000+ Stock Universe**: Powered by an seed generator (`seedStocks.ts`) producing consistent market caps, prices, sectors, industries, and technical parameters.
- **Sub-200ms AST Filter Engine**: A compiler engine (`filterEngine.ts`) that JIT-compiles nested logical criteria (AND/OR groups) and executes short-circuit evaluations across the entire universe.
- **High-Frequency WebSocket Updates**: Real-time mock stream simulating Geometric Brownian Motion (GBM) sector and market shocks. Tick buffering uses `requestAnimationFrame` and batches writes at 100ms intervals to achieve 60 FPS rendering.
- **Double-Buffered DOM Flashing**: Cell flashing triggers direct DOM ref modifications to highlight price updates (green for gains, red for losses) without triggering full React render cycles.
- **Synced Technical Charts**: Synchronized dual-pane candlestick and volume chart (primary) plus RSI oscillator chart (secondary) built on `lightweight-charts`. Crosshairs, zooms, and visible ranges are locked together.
- **Manual Technical Indicators**: Manual, high-performance mathematical overlays computed inside the frontend (SMA, EMA, RSI, Bollinger Bands, VWAP, and Volume Profile).
- **Interactive Watchlists**: Persisted watchlists synced via LocalStorage.
- **Real-Time Alerts Queue**: Dynamic monitoring of stock events (52W high/low, >4% price spikes, volume spikes) with toast alert notifications.

---

## Tech Stack

- **Core Framework**: Next.js 16 (App Router), React 19, TypeScript (Strict Mode)
- **Styling**: TailwindCSS 4 (Vanilla CSS variables)
- **State Management**: Zustand
- **Table Virtualization**: TanStack Table v8, TanStack Virtual v3
- **Data Visualizations**: Lightweight Charts v5.2 (Unified Series API)
- **Asynchronous Queries**: TanStack React Query v5
- **Mock Seeding**: `@faker-js/faker`
- **Testing**: Vitest (Unit), Playwright (E2E)

---

## Screenshots

*Placeholders for application interfaces:*

- **Market Dashboard Overview**
  ![Dashboard Screenshot Placeholder](https://via.placeholder.com/1200x675/0f172a/ffffff?text=Stock+Screener+Dashboard+Overview)
- **AST Advanced Rule Builder**
  ![Filter Screenshot Placeholder](https://via.placeholder.com/1200x675/0f172a/ffffff?text=AST+Advanced+Rule+Builder)
- **Technical Charting Pane**
  ![Chart Screenshot Placeholder](https://via.placeholder.com/1200x675/0f172a/ffffff?text=Dual-Pane+Synced+Technical+Charts)

---

## Folder Structure

```text
stock-screener/
├── app/                    # Next.js App Router Pages & APIs
│   ├── api/                # Backend HTTP Endpoints
│   │   ├── filters/        # Saved filter criteria configurations
│   │   ├── sectors/        # Sector breadth aggregations
│   │   └── stocks/         # Stock list & historical data seeds
│   ├── globals.css         # Styling system & Tailwind CSS directives
│   ├── layout.tsx          # HTML Shell Layout
│   └── page.tsx            # Main Application page entrypoint
├── src/                    # Primary Source Directory
│   ├── components/         # Modular UI Component Layer
│   │   ├── Charts/         # Lightweight Charts wrappers (ChartPanel.tsx)
│   │   ├── Dashboard/      # Watchlists, header metrics, stats, overview
│   │   ├── Filters/        # Standard filters and Advanced AST panel
│   │   ├── Layout/         # Primary application dashboard wrappers
│   │   ├── Providers/      # TanStack Query & Theme wrappers
│   │   └── Table/          # Virtualized Stock Table (StockTable.tsx)
│   ├── data/               # Seed datasets (seedStocks.ts)
│   ├── hooks/              # Custom React Hooks
│   │   ├── useIndicators.ts   # Memoized calculations for math metrics
│   │   ├── useWebSocket.ts    # requestAnimationFrame batching wrapper
│   │   └── useStockScreener.ts# TanStack Table logic connector
│   ├── services/           # Service layer
│   │   └── websocketService.ts# GBM mock WebSocket publisher
│   ├── store/              # Zustand global state slices
│   ├── tests/              # Vitest & Playwright test suites
│   ├── types/              # Type Declarations (Stock, Filter, Alert, Chart)
│   └── utils/              # Utility helpers
│       ├── filterEngine.ts # JIT AST compiler engine
│       └── indicators.ts   # Mathematical formulas for indicators
├── tsconfig.json           # Strict TypeScript configuration
├── vitest.config.ts        # Vitest runner settings
└── package.json            # Dependencies & Scripts
```

---

## Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Aryan-kuma-wat/zetheta123.git
   cd stock-screener
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Verify environments**:
   Create a `.env` file (or copy `.env.example`):
   ```bash
   cp .env.example .env
   ```

---

## Running Locally

- **Development Server**:
  ```bash
  npm run dev
  ```
  Open [http://localhost:3000](http://localhost:3000) to view the screener.

- **Production Build**:
  ```bash
  npm run build
  npm start
  ```

- **Run Tests**:
  ```bash
  # Run Unit Tests (Vitest)
  npm run test

  # Run E2E Tests (Playwright)
  npx playwright test
  ```

---

## Performance Highlights

- **AST Rule Compilation Cache**: Compilation of filter rules is cached to prevent redundant logical structures from recompiling.
- **requestAnimationFrame Tick Batching**: Real-time stock quotes are buffered in a queue and flushed to state at `100ms` intervals, reducing React updates by up to 90%.
- **O(1) Map Lookup**: Stock data is maintained in a hash map (`Map<string, Stock>`) to support instantaneous lookup by ticker symbol.
- **Ref-Based DOM Modification**: Flash animations mutate DOM `className` directly through refs, avoiding expensive layout thrashing.
- **TanStack Table Virtualization**: Renders only the active viewport rows, scaling from 5,000+ stocks down to ~30 DOM elements.

---

## Deployment

This application is ready for deployment on **Vercel** with custom edge caching headers configured in `vercel.json` for high availability.

- **GitHub Repository**: [Aryan-kuma-wat/zetheta123](https://github.com/Aryan-kuma-wat/zetheta123)
- **Live Deployment URL**: [zetheta123.vercel.app](https://project1-dgm9dvde8-aryank-175002.vercel.app/)

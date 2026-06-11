/**
 * DashboardLayout.tsx
 * Location: src/components/Layout/DashboardLayout.tsx
 *
 * The main 3-column layout shell used by the dashboard page.
 *
 * Structure:
 *   ┌──────────────────────────────┐
 *   │         Header               │  ← full width
 *   ├──────────────────────────────┤
 *   │      Stats Cards (4)         │  ← full width
 *   ├────────┬───────────┬─────────┤
 *   │Filters │   Table   │  Chart  │  ← 3 columns
 *   └────────┴───────────┴─────────┘
 *
 * It receives left, center, right, and header as props
 * so any content can be plugged in without editing this file.
 */

import React from "react";

interface DashboardLayoutProps {
  /** The top navigation bar */
  header: React.ReactNode;

  /** The 4 stats cards row */
  statsCards: React.ReactNode;

  /** Left column — filter panel */
  left: React.ReactNode;

  /** Center column — stock table */
  center: React.ReactNode;

  /** Right column — chart panel */
  right: React.ReactNode;
}

export default function DashboardLayout({
  header,
  statsCards,
  left,
  center,
  right,
}: DashboardLayoutProps) {
  return (
    // Full-screen dark container
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">

      {/* ── Top: Header ── */}
      <div className="flex-shrink-0">
        {header}
      </div>

      {/* ── Main scrollable area ── */}
      <main className="flex-1 flex flex-col gap-4 p-4 overflow-hidden">

        {/* ── Stats Cards Row ── */}
        <section aria-label="Summary statistics">
          {statsCards}
        </section>

        {/* ── 3-Column Grid ──
              On mobile: stacks vertically
              On large screens: left(fixed) | center(grows) | right(fixed)
        ── */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[260px_1fr_320px] gap-4 min-h-0">

          {/* Left — Filters */}
          <aside
            className="bg-gray-900 rounded-xl border border-gray-800 overflow-y-auto"
            aria-label="Filter panel"
          >
            {left}
          </aside>

          {/* Center — Table */}
          <section
            className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden flex flex-col"
            aria-label="Stock table"
          >
            {center}
          </section>

          {/* Right — Chart */}
          <aside
            className="bg-gray-900 rounded-xl border border-gray-800 overflow-y-auto"
            aria-label="Chart panel"
          >
            {right}
          </aside>

        </div>
      </main>
    </div>
  );
}

"use client";

import React, { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  createChart,
  ColorType,
  IChartApi,
  ISeriesApi,
  CandlestickSeries,
  LineSeries,
  HistogramSeries,
  Time,
} from "lightweight-charts";
import { useChartStore } from "@/store/useChartStore";
import { useStockStore } from "@/store/useStockStore";
import { useIndicators } from "@/hooks/useIndicators";
import { useWebSocket } from "@/hooks/useWebSocket";
import type { Candle, StockPatch } from "@/types/stock";
import {
  TrendingUp,
  Sliders,
  Settings,
  Calendar,
  Activity,
  Maximize2,
  Minimize2,
} from "lucide-react";

// Timeframe buttons
const TIMEFRAMES = ["1D", "5D", "1W", "1M", "3M", "6M", "1Y", "5Y"] as const;

async function fetchStockHistory(symbol: string, timeframe: string): Promise<Candle[]> {
  const res = await fetch(`/api/stocks/${symbol}/history?timeframe=${timeframe}`);
  if (!res.ok) {
    throw new Error("Failed to fetch candle history");
  }
  const envelope = await res.json();
  return envelope.data.candles;
}

export default function ChartPanel() {
  const activeTicker = useChartStore((s: any) => s.activeTicker);
  const timeframe = useChartStore((s: any) => s.timeframe);
  const setTimeframe = useChartStore((s: any) => s.setTimeframe);
  const activeIndicators = useChartStore((s: any) => s.activeIndicators);
  const theme = useChartStore((s: any) => s.theme);

  const selectedStockData = useStockStore((s: any) => {
    if (!activeTicker) return undefined;
    return s.stocks.get(activeTicker);
  });

  // Default fallback if no ticker is selected
  const ticker = activeTicker ?? "AAPL";

  // Fetch candle history from API
  const { data: rawCandles = [], isLoading, error } = useQuery<Candle[]>({
    queryKey: ["history", ticker, timeframe],
    queryFn: () => fetchStockHistory(ticker, timeframe),
    staleTime: 60 * 1000, // cache for 1 minute
    enabled: !!ticker,
  });

  // Maintain local mutable ref of the last candle for WebSocket real-time appending
  const lastCandleRef = useRef<Candle | null>(null);

  // Update local ref whenever new historical query finishes
  useEffect(() => {
    if (rawCandles.length > 0) {
      lastCandleRef.current = rawCandles[rawCandles.length - 1];
    }
  }, [rawCandles]);

  // Compute all indicators math overlays on historical data (stable reference!)
  const { smas, emas, rsis, bollingerBands, vwaps, volumeProfile } = useIndicators(rawCandles);

  // References to the chart containers
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const rsiContainerRef = useRef<HTMLDivElement>(null);

  // References to raw lightweight-charts instances
  const chartRef = useRef<IChartApi | null>(null);
  const rsiChartRef = useRef<IChartApi | null>(null);
  
  // References to drawn lines/series APIs
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const rsiSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  
  // Maps of drawn overlays to allow quick dynamic toggles/color changes
  const overlayLinesRef = useRef<Map<string, ISeriesApi<"Line">>>(new Map());
  const bbSeriesRef = useRef<Map<string, { upper: ISeriesApi<"Line">; middle: ISeriesApi<"Line">; lower: ISeriesApi<"Line"> }>>(new Map());

  // Listen to WebSocket ticks to append live price fluctuations directly to the chart series without triggering React re-renders!
  useEffect(() => {
    if (rawCandles.length === 0) return;

    const handleWsTick = (patches: StockPatch[]) => {
      const patch = patches.find((p) => p.symbol === ticker);
      if (!patch) return;

      const lastCandle = lastCandleRef.current;
      if (!lastCandle) return;

      // Format to seconds matching TV charts
      const patchSec = Math.floor(patch.lastUpdated / 1000);

      // If tick timestamp is on the SAME trading day, update the last candle
      // If it is a NEW trading day, push a new candle
      const tradingDaySeconds = 86400;
      const isSameDay = patchSec - lastCandle.time < tradingDaySeconds;

      if (isSameDay) {
        const updatedLast: Candle = {
          ...lastCandle,
          close: patch.price,
          high: Math.max(lastCandle.high, patch.price),
          low: Math.min(lastCandle.low, patch.price),
          volume: patch.volume,
        };
        lastCandleRef.current = updatedLast;
        
        // Apply tick directly to active TV series (very smooth update!)
        if (candleSeriesRef.current) {
          candleSeriesRef.current.update({
            time: updatedLast.time as Time,
            open: updatedLast.open,
            high: updatedLast.high,
            low: updatedLast.low,
            close: updatedLast.close,
          });
        }
        if (volumeSeriesRef.current) {
          volumeSeriesRef.current.update({
            time: updatedLast.time as Time,
            value: updatedLast.volume,
            color: updatedLast.close >= updatedLast.open ? "#22c55e" : "#ef4444",
          });
        }
      } else {
        // Push new bar
        const newBar: Candle = {
          time: patchSec,
          open: patch.price,
          high: patch.price,
          low: patch.price,
          close: patch.price,
          volume: 1000,
        };
        lastCandleRef.current = newBar;
        
        if (candleSeriesRef.current) {
          candleSeriesRef.current.update({
            time: newBar.time as Time,
            open: newBar.open,
            high: newBar.high,
            low: newBar.low,
            close: newBar.close,
          });
        }
      }
    };

    const wsInstance = require("@/services/websocketService").wsService;
    wsInstance.onMessage(handleWsTick);

    return () => {
      wsInstance.offMessage(handleWsTick);
    };
  }, [rawCandles, ticker]);

  // Main Canvas Drawer initializer
  useEffect(() => {
    const chartContainer = chartContainerRef.current;
    const rsiContainer = rsiContainerRef.current;
    if (!chartContainer || !rsiContainer || rawCandles.length === 0) return;

    // ─────────────────────────────────────────────
    //  1. Draw Primary Candlesticks Chart
    // ─────────────────────────────────────────────
    const primaryChart = createChart(chartContainer, {
      width: chartContainer.clientWidth,
      height: 280,
      layout: {
        background: { type: ColorType.Solid, color: "#0f172a" }, // slate-900 matching dashboard
        textColor: "#94a3b8", // slate-400
      },
      grid: {
        vertLines: { color: "#1e293b" }, // slate-800
        horzLines: { color: "#1e293b" },
      },
      timeScale: {
        borderColor: "#334155",
        timeVisible: true,
        secondsVisible: false,
      },
    });

    // Add candlestick series (Lightweight Charts v5.0+ API)
    const candleSeries = primaryChart.addSeries(CandlestickSeries, {
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderUpColor: "#22c55e",
      borderDownColor: "#ef4444",
      wickUpColor: "#22c55e",
      wickDownColor: "#ef4444",
    });

    // Populate history data
    candleSeries.setData(
      rawCandles.map((c) => ({
        time: c.time as Time,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }))
    );
    candleSeriesRef.current = candleSeries;

    // Add Volume Bar Histogram series on same pane (sub-overlay)
    const volumeSeries = primaryChart.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
      priceScaleId: "", // overlay
    });
    
    // Scale volume bars to fit lower 20% of pane
    volumeSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    });

    volumeSeries.setData(
      rawCandles.map((c) => ({
        time: c.time as Time,
        value: c.volume,
        color: c.close >= c.open ? "#22c55e" : "#ef4444",
      }))
    );
    volumeSeriesRef.current = volumeSeries;

    chartRef.current = primaryChart;

    // ─────────────────────────────────────────────
    //  2. Draw Secondary RSI Oscillator Chart
    // ─────────────────────────────────────────────
    const rsiChart = createChart(rsiContainer, {
      width: rsiContainer.clientWidth,
      height: 90,
      layout: {
        background: { type: ColorType.Solid, color: "#0f172a" },
        textColor: "#94a3b8",
      },
      grid: {
        vertLines: { color: "#1e293b" },
        horzLines: { color: "#1e293b" },
      },
      timeScale: {
        borderColor: "#334155",
        visible: false, // hide time axis on subchart to stack perfectly
      },
      leftPriceScale: {
        visible: false,
      },
      rightPriceScale: {
        visible: true,
        borderColor: "#334155",
      },
    });

    // Fit price scale to standard RSI bounds (0-100)
    rsiChart.priceScale("right").applyOptions({
      autoScale: false,
    });

    // Add RSI main line
    const rsiLineSeries = rsiChart.addSeries(LineSeries, {
      color: "#06b6d4", // cyan-500
      lineWidth: 2,
      priceFormat: {
        type: "custom",
        formatter: (v: number) => v.toFixed(0),
        minMove: 1,
      },
    });

    // Draw reference threshold lines (70 overbought, 30 oversold)
    const rsiUpperLimit = rsiChart.addSeries(LineSeries, { color: "#ef4444", lineWidth: 1, lineStyle: 1 });
    const rsiLowerLimit = rsiChart.addSeries(LineSeries, { color: "#22c55e", lineWidth: 1, lineStyle: 1 });

    rsiUpperLimit.setData(rawCandles.map((c) => ({ time: c.time as Time, value: 70 })));
    rsiLowerLimit.setData(rawCandles.map((c) => ({ time: c.time as Time, value: 30 })));

    rsiSeriesRef.current = rsiLineSeries;
    rsiChartRef.current = rsiChart;

    // Synchronize both chart crosshairs and zooming scales (locked together!)
    let isSyncing = false;
    primaryChart.timeScale().subscribeVisibleTimeRangeChange((range) => {
      if (isSyncing) return;
      isSyncing = true;
      rsiChart.timeScale().setVisibleRange(range!);
      isSyncing = false;
    });

    rsiChart.timeScale().subscribeVisibleTimeRangeChange((range) => {
      if (isSyncing) return;
      isSyncing = true;
      primaryChart.timeScale().setVisibleRange(range!);
      isSyncing = false;
    });

    // Fit graphs to window size on mount
    primaryChart.timeScale().fitContent();

    // ─────────────────────────────────────────────
    //  3. Draw Manual Math Indicators Overlays
    // ─────────────────────────────────────────────
    
    // Clear any previous references
    overlayLinesRef.current.clear();
    bbSeriesRef.current.clear();

    activeIndicators.forEach((config: any) => {
      if (!config.visible) return;

      if (config.type === "SMA" || config.type === "EMA" || config.type === "VWAP") {
        const calculated =
          config.type === "SMA" ? smas.get(config.id) :
          config.type === "EMA" ? emas.get(config.id) :
          vwaps.get(config.id);

        if (calculated && calculated.length > 0) {
          const line = primaryChart.addSeries(LineSeries, {
            color: config.color,
            lineWidth: 2,
            title: `${config.type} (${config.params.period ?? ""})`,
          });
          line.setData(calculated.map((p) => ({ time: p.time as Time, value: p.value })));
          overlayLinesRef.current.set(config.id, line);
        }
      } else if (config.type === "RSI") {
        const calculated = rsis.get(config.id);
        if (calculated && calculated.length > 0) {
          rsiLineSeries.setData(calculated.map((p) => ({ time: p.time as Time, value: p.value })));
        }
      } else if (config.type === "BB") {
        const calculated = bollingerBands.get(config.id);
        if (calculated && calculated.length > 0) {
          // Upper, middle, and lower lines
          const upperLine = primaryChart.addSeries(LineSeries, {
            color: config.color,
            lineWidth: 1,
            lineStyle: 2, // dashed
            title: `BB Upper`,
          });
          const middleLine = primaryChart.addSeries(LineSeries, {
            color: "#64748b",
            lineWidth: 1,
            title: `BB Basis`,
          });
          const lowerLine = primaryChart.addSeries(LineSeries, {
            color: config.color,
            lineWidth: 1,
            lineStyle: 2, // dashed
            title: `BB Lower`,
          });

          upperLine.setData(calculated.map((p) => ({ time: p.time as Time, value: p.upper })));
          middleLine.setData(calculated.map((p) => ({ time: p.time as Time, value: p.middle })));
          lowerLine.setData(calculated.map((p) => ({ time: p.time as Time, value: p.lower })));

          bbSeriesRef.current.set(config.id, {
            upper: upperLine,
            middle: middleLine,
            lower: lowerLine,
          });
        }
      }
    });

    // Handle resizing responsiveness
    const handleResize = () => {
      if (chartContainerRef.current) {
        primaryChart.resize(chartContainerRef.current.clientWidth, 280);
      }
      if (rsiContainerRef.current) {
        rsiChart.resize(rsiContainerRef.current.clientWidth, 90);
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      primaryChart.remove();
      rsiChart.remove();
    };

  }, [rawCandles, activeIndicators, smas, emas, rsis, bollingerBands, vwaps]);

  return (
    <div className="flex flex-col h-full bg-gray-900 border border-gray-800 text-white rounded-xl overflow-hidden p-4 space-y-3 select-none">
      
      {/* ── Header: Ticker, Name, Prices ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap border-b border-gray-850 pb-2">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-950 text-blue-400 font-bold rounded-lg flex items-center justify-center border border-blue-900/30">
            {ticker}
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5 leading-tight">
              {selectedStockData?.name || "Select Stock"} 
              <span className="text-[10px] text-gray-500 font-normal">({selectedStockData?.exchange})</span>
            </h3>
            <p className="text-xs text-gray-500 font-medium leading-tight">
              {selectedStockData?.sector} / {selectedStockData?.industry}
            </p>
          </div>
        </div>

        {/* Live quote metrics */}
        {selectedStockData && (
          <div className="text-right leading-none">
            <span className="text-lg font-extrabold text-white">
              ${selectedStockData.price.toFixed(selectedStockData.price > 10 ? 2 : 4)}
            </span>
            <div
              className={`text-xs font-bold flex items-center justify-end gap-0.5 mt-0.5 ${
                selectedStockData.changePercent >= 0 ? "text-green-400" : "text-red-400"
              }`}
            >
              {selectedStockData.changePercent >= 0 ? "+" : ""}
              {selectedStockData.changePercent.toFixed(2)}%
            </div>
          </div>
        )}
      </div>

      {/* ── Main chart Canvas Area ── */}
      <div className="flex-1 min-h-[380px] bg-slate-900 rounded-xl relative overflow-hidden flex flex-col justify-between border border-gray-850 p-2">
        
        {/* Loading skeleton overlays */}
        {isLoading && (
          <div className="absolute inset-0 bg-slate-900/90 z-20 flex items-center justify-center flex-col gap-2">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-gray-400 font-bold">Querying market canvas data...</p>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 bg-slate-900 z-20 flex items-center justify-center text-center p-4">
            <p className="text-xs text-red-400 font-bold">Error loading chart: {error.message}</p>
          </div>
        )}

        {/* Primary Pane */}
        <div ref={chartContainerRef} className="w-full flex-1 min-h-[280px]" />
        
        {/* RSI pane divider */}
        <div className="border-t border-gray-850 my-1 relative">
          <span className="absolute -top-2 left-4 bg-gray-900 border border-gray-850 text-[8px] text-gray-400 font-bold px-1.5 py-0.5 rounded-full select-none z-10">
            RSI Oscillator (14)
          </span>
        </div>

        {/* Secondary RSI Pane */}
        <div ref={rsiContainerRef} className="w-full h-[90px]" />
      </div>

      {/* ── Timeframe Pills Bar ── */}
      <div className="flex-shrink-0 flex items-center justify-between gap-4 flex-wrap border-t border-gray-850 pt-2 select-none">
        
        {/* Timeframe picker */}
        <div className="flex bg-gray-950 p-0.5 rounded-lg border border-gray-850 text-[10px] font-bold">
          {TIMEFRAMES.map((tf) => {
            const isSelected = timeframe === tf;
            return (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                  isSelected
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-gray-500 hover:text-white"
                }`}
              >
                {tf}
              </button>
            );
          })}
        </div>

        {/* Quick indicators status display */}
        <div className="text-[10px] text-gray-500 font-semibold flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-blue-500" />
          <span>Manual overlays:</span>
          <div className="flex gap-1.5">
            {activeIndicators.map((i: any) => (
              <span
                key={i.id}
                className="bg-gray-850 px-1.5 py-0.5 rounded border border-gray-800 text-gray-400 uppercase text-[8px]"
                style={{ borderColor: i.visible ? `${i.color}44` : "" }}
              >
                {i.type}
              </span>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

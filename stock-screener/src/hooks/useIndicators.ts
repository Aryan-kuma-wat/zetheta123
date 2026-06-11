import { useMemo } from "react";
import { useChartStore } from "@/store/useChartStore";
import {
  calculateSMA,
  calculateEMA,
  calculateRSI,
  calculateBollingerBands,
  calculateMACD,
  calculateVWAP,
  calculateVolumeProfile,
  type IndicatorPoint,
  type BollingerBandsPoint,
  type MacdPoint,
  type VolumeProfileBin,
} from "@/utils/indicators";
import type { Candle } from "@/types/stock";

interface CalculatedIndicators {
  smas: Map<string, IndicatorPoint[]>; // key: indicator instance id
  emas: Map<string, IndicatorPoint[]>; // key: indicator instance id
  rsis: Map<string, IndicatorPoint[]>;
  macds: Map<string, MacdPoint[]>;
  bollingerBands: Map<string, BollingerBandsPoint[]>;
  vwaps: Map<string, IndicatorPoint[]>;
  volumeProfile: VolumeProfileBin[];
}

/**
 * Hook to automatically calculate and cache mathematical indicators
 * for the currently active stock candles, matching the user's overlay options.
 */
export function useIndicators(candles: Candle[]): CalculatedIndicators {
  const activeIndicators = useChartStore((s: any) => s.activeIndicators);

  return useMemo(() => {
    const smas = new Map<string, IndicatorPoint[]>();
    const emas = new Map<string, IndicatorPoint[]>();
    const rsis = new Map<string, IndicatorPoint[]>();
    const macds = new Map<string, MacdPoint[]>();
    const bollingerBands = new Map<string, BollingerBandsPoint[]>();
    const vwaps = new Map<string, IndicatorPoint[]>();

    if (candles.length === 0) {
      return { smas, emas, rsis, macds, bollingerBands, vwaps, volumeProfile: [] };
    }

    // Process each configured indicator
    for (let i = 0; i < activeIndicators.length; i++) {
      const config = activeIndicators[i];
      if (!config.visible) continue;

      const p = config.params;

      try {
        switch (config.type) {
          case "SMA":
            const periodSMA = p.period ?? 20;
            smas.set(config.id, calculateSMA(candles, periodSMA));
            break;
          case "EMA":
            const periodEMA = p.period ?? 20;
            emas.set(config.id, calculateEMA(candles, periodEMA));
            break;
          case "RSI":
            const periodRSI = p.period ?? 14;
            rsis.set(config.id, calculateRSI(candles, periodRSI));
            break;
          case "MACD":
            const fast = p.fast ?? 12;
            const slow = p.slow ?? 26;
            const signal = p.signal ?? 9;
            macds.set(config.id, calculateMACD(candles, fast, slow, signal));
            break;
          case "BB":
            const periodBB = p.period ?? 20;
            const stdDev = p.stdDev ?? 2;
            bollingerBands.set(config.id, calculateBollingerBands(candles, periodBB, stdDev));
            break;
          case "VWAP":
            vwaps.set(config.id, calculateVWAP(candles));
            break;
          default:
            break;
        }
      } catch (err) {
        console.error(`[Math Engine] Error calculating indicator ${config.type}:`, err);
      }
    }

    // Always calculate volume profile for horizontal overlay (e.g. 24 price buckets)
    const volumeProfile = calculateVolumeProfile(candles, 24);

    return {
      smas,
      emas,
      rsis,
      macds,
      bollingerBands,
      vwaps,
      volumeProfile,
    };
  }, [candles, activeIndicators]);
}

export default useIndicators;

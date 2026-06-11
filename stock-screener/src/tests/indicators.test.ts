import { describe, it, expect } from "vitest";
import {
  calculateSMA,
  calculateEMA,
  calculateRSI,
  calculateBollingerBands,
  calculateVWAP,
} from "../utils/indicators";
import type { Candle } from "@/types/stock";

// Helper to generate simple sequential price candles
function generateTestCandles(prices: number[]): Candle[] {
  return prices.map((price, idx) => ({
    time: 1716652800 + idx * 86400, // sequential daily unix timestamps
    open: price,
    high: price * 1.01,
    low: price * 0.99,
    close: price,
    volume: 10000 + idx * 1000,
  }));
}

describe("Technical Analysis Math Engine", () => {
  
  it("should correctly compute Simple Moving Average (SMA)", () => {
    const candles = generateTestCandles([10, 11, 12, 13, 14, 15]);
    const period = 3;
    const sma = calculateSMA(candles, period);

    // SMA 3 on [10, 11, 12] is 11
    // SMA 3 on [11, 12, 13] is 12
    // SMA 3 on [12, 13, 14] is 13
    // SMA 3 on [13, 14, 15] is 14
    expect(sma.length).toBe(4);
    expect(sma[0].value).toBe(11.0);
    expect(sma[1].value).toBe(12.0);
    expect(sma[2].value).toBe(13.0);
    expect(sma[3].value).toBe(14.0);
  });

  it("should return empty SMA when prices length is less than period", () => {
    const candles = generateTestCandles([10, 11]);
    const sma = calculateSMA(candles, 3);
    expect(sma).toEqual([]);
  });

  it("should correctly compute Exponential Moving Average (EMA)", () => {
    const candles = generateTestCandles([10, 11, 12, 13, 14]);
    const period = 3;
    const ema = calculateEMA(candles, period);

    // Initial EMA (at index period-1) is the SMA over first period: SMA(3) of [10,11,12] = 11
    expect(ema.length).toBe(3);
    expect(ema[0].value).toBe(11.0);

    // Next EMA = 13 * k + prevEma * (1 - k) where k = 2 / (3 + 1) = 0.5
    // EMA(13) = 13 * 0.5 + 11 * 0.5 = 12.0
    expect(ema[1].value).toBe(12.0);
    
    // EMA(14) = 14 * 0.5 + 12 * 0.5 = 13.0
    expect(ema[2].value).toBe(13.0);
  });

  it("should correctly compute Relative Strength Index (RSI) using Wilder's smoothing", () => {
    // A series that steadily increases then drops
    const candles = generateTestCandles([
      10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, // 15 values (14 intervals)
      28, // drop
    ]);
    
    const rsi = calculateRSI(candles, 14);
    expect(rsi.length).toBe(2);

    // The first RSI point (at index 14, which is the 15th price '38') is 100 because there are only gains
    expect(rsi[0].value).toBe(100.0);

    // The second RSI point incorporates the drop from 38 to 28 (-10)
    // RSI should contract below 100
    expect(rsi[1].value).toBeLessThan(100.0);
    expect(rsi[1].value).toBeGreaterThan(0.0);
  });

  it("should correctly compute Bollinger Bands (BB)", () => {
    const candles = generateTestCandles([10, 10, 10, 10, 10]); // standard deviation is 0
    const period = 3;
    const bands = calculateBollingerBands(candles, period, 2);

    expect(bands.length).toBe(3);
    // Since stdDev is 0, upper, middle, and lower should all equal the average (10)
    expect(bands[0].middle).toBe(10.0);
    expect(bands[0].upper).toBe(10.0);
    expect(bands[0].lower).toBe(10.0);
  });

  it("should correctly compute Volume Weighted Average Price (VWAP)", () => {
    const candles = generateTestCandles([10, 20]); // typical prices: 10, 20. volume: 10000, 11000.
    const vwap = calculateVWAP(candles);

    expect(vwap.length).toBe(2);
    expect(vwap[0].value).toBeCloseTo(10.0, 1);
    
    // Cumulative (Typical * Vol) = 10 * 10000 + 20 * 11000 = 100000 + 220000 = 320000
    // Cumulative Vol = 10000 + 11000 = 21000
    // VWAP = 320000 / 21000 = 15.238
    expect(vwap[1].value).toBeCloseTo(15.238, 2);
  });
});

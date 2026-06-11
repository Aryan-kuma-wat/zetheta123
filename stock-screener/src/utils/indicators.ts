import type { Candle } from "@/types/stock";

export interface IndicatorPoint {
  time: number;
  value: number;
}

export interface BollingerBandsPoint {
  time: number;
  middle: number;
  upper: number;
  lower: number;
}

export interface MacdPoint {
  time: number;
  macd: number;
  signal: number;
  histogram: number;
}

export interface VolumeProfileBin {
  price: number;
  volume: number;
  isPoc: boolean; // Point of Control (highest volume bin)
}

/**
 * Calculates Simple Moving Average (SMA)
 */
export function calculateSMA(candles: Candle[], period: number): IndicatorPoint[] {
  if (candles.length < period) return [];

  const sma: IndicatorPoint[] = [];
  let sum = 0;

  // Initialize sum for the first window
  for (let i = 0; i < period; i++) {
    sum += candles[i].close;
  }

  sma.push({
    time: candles[period - 1].time,
    value: parseFloat((sum / period).toFixed(4)),
  });

  // Slide the window across the rest of the array
  for (let i = period; i < candles.length; i++) {
    sum = sum - candles[i - period].close + candles[i].close;
    sma.push({
      time: candles[i].time,
      value: parseFloat((sum / period).toFixed(4)),
    });
  }

  return sma;
}

/**
 * Calculates Exponential Moving Average (EMA)
 */
export function calculateEMA(candles: Candle[], period: number): IndicatorPoint[] {
  if (candles.length < period) return [];

  const ema: IndicatorPoint[] = [];
  const k = 2 / (period + 1);

  // Initialize with SMA
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += candles[i].close;
  }
  let prevEma = sum / period;

  ema.push({
    time: candles[period - 1].time,
    value: parseFloat(prevEma.toFixed(4)),
  });

  // Calculate subsequent points
  for (let i = period; i < candles.length; i++) {
    const currentEma = candles[i].close * k + prevEma * (1 - k);
    ema.push({
      time: candles[i].time,
      value: parseFloat(currentEma.toFixed(4)),
    });
    prevEma = currentEma;
  }

  return ema;
}

/**
 * Calculates Relative Strength Index (RSI) using Wilder's smoothing technique
 */
export function calculateRSI(candles: Candle[], period = 14): IndicatorPoint[] {
  if (candles.length <= period) return [];

  const rsiPoints: IndicatorPoint[] = [];
  let avgGain = 0;
  let avgLoss = 0;

  // Calculate gains/losses for the first period
  for (let i = 1; i <= period; i++) {
    const change = candles[i].close - candles[i - 1].close;
    if (change > 0) {
      avgGain += change;
    } else {
      avgLoss += Math.abs(change);
    }
  }

  avgGain /= period;
  avgLoss /= period;

  const firstRs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  const firstRsi = avgLoss === 0 ? 100 : 100 - 100 / (1 + firstRs);

  rsiPoints.push({
    time: candles[period].time,
    value: parseFloat(firstRsi.toFixed(2)),
  });

  // Calculate Wilder's smoothed values
  for (let i = period + 1; i < candles.length; i++) {
    const change = candles[i].close - candles[i - 1].close;
    const currentGain = change > 0 ? change : 0;
    const currentLoss = change < 0 ? Math.abs(change) : 0;

    avgGain = (avgGain * (period - 1) + currentGain) / period;
    avgLoss = (avgLoss * (period - 1) + currentLoss) / period;

    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    const rsi = avgLoss === 0 ? 100 : 100 - 100 / (1 + rs);

    rsiPoints.push({
      time: candles[i].time,
      value: parseFloat(rsi.toFixed(2)),
    });
  }

  return rsiPoints;
}

/**
 * Calculates Bollinger Bands (BB)
 */
export function calculateBollingerBands(
  candles: Candle[],
  period = 20,
  stdDevMultiplier = 2
): BollingerBandsPoint[] {
  if (candles.length < period) return [];

  const bands: BollingerBandsPoint[] = [];

  for (let i = period - 1; i < candles.length; i++) {
    // 1. Calculate SMA (Middle Band)
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) {
      sum += candles[j].close;
    }
    const middle = sum / period;

    // 2. Calculate Standard Deviation
    let varianceSum = 0;
    for (let j = i - period + 1; j <= i; j++) {
      varianceSum += Math.pow(candles[j].close - middle, 2);
    }
    const stdDev = Math.sqrt(varianceSum / period);

    // 3. Bands
    const upper = middle + stdDevMultiplier * stdDev;
    const lower = middle - stdDevMultiplier * stdDev;

    bands.push({
      time: candles[i].time,
      middle: parseFloat(middle.toFixed(4)),
      upper: parseFloat(upper.toFixed(4)),
      lower: parseFloat(lower.toFixed(4)),
    });
  }

  return bands;
}

/**
 * Calculates Moving Average Convergence Divergence (MACD)
 */
export function calculateMACD(
  candles: Candle[],
  fastPeriod = 12,
  slowPeriod = 26,
  signalPeriod = 9
): MacdPoint[] {
  if (candles.length < slowPeriod + signalPeriod) return [];

  // Helper to calculate EMA on raw number array instead of Candles
  const calculateEmaFromArray = (data: number[], period: number): number[] => {
    const ema: number[] = [];
    const k = 2 / (period + 1);

    let sum = 0;
    for (let i = 0; i < period; i++) {
      sum += data[i];
    }
    let prevEma = sum / period;
    ema.push(prevEma);

    for (let i = period; i < data.length; i++) {
      const currentEma = data[i] * k + prevEma * (1 - k);
      ema.push(currentEma);
      prevEma = currentEma;
    }

    return ema;
  };

  const closes = candles.map((c) => c.close);

  // 1. Calculate Fast EMA (12)
  const fastEmaPts = calculateEMA(candles, fastPeriod);
  // 2. Calculate Slow EMA (26)
  const slowEmaPts = calculateEMA(candles, slowPeriod);

  // Align Fast & Slow EMA by timestamp
  const fastEmaMap = new Map(fastEmaPts.map((p) => [p.time, p.value]));
  const slowEmaMap = new Map(slowEmaPts.map((p) => [p.time, p.value]));

  const commonTimes: number[] = [];
  const rawMacdValues: number[] = [];

  for (const candle of candles) {
    const fast = fastEmaMap.get(candle.time);
    const slow = slowEmaMap.get(candle.time);
    if (fast !== undefined && slow !== undefined) {
      commonTimes.push(candle.time);
      rawMacdValues.push(fast - slow);
    }
  }

  if (rawMacdValues.length < signalPeriod) return [];

  // 3. Calculate Signal Line (9 EMA of MACD line)
  const rawSignalValues = calculateEmaFromArray(rawMacdValues, signalPeriod);

  const macdPoints: MacdPoint[] = [];
  const macdOffset = signalPeriod - 1;

  for (let i = macdOffset; i < rawMacdValues.length; i++) {
    const time = commonTimes[i];
    const macd = rawMacdValues[i];
    const signal = rawSignalValues[i - macdOffset];
    const histogram = macd - signal;

    macdPoints.push({
      time,
      macd: parseFloat(macd.toFixed(4)),
      signal: parseFloat(signal.toFixed(4)),
      histogram: parseFloat(histogram.toFixed(4)),
    });
  }

  return macdPoints;
}

/**
 * Calculates Volume Weighted Average Price (VWAP)
 * VWAP = Cum(Typical Price * Volume) / Cum(Volume)
 * Typical Price = (High + Low + Close) / 3
 */
export function calculateVWAP(candles: Candle[]): IndicatorPoint[] {
  if (candles.length === 0) return [];

  const vwap: IndicatorPoint[] = [];
  let cumulativeTypicalVolume = 0;
  let cumulativeVolume = 0;

  for (const candle of candles) {
    const typicalPrice = (candle.high + candle.low + candle.close) / 3;
    cumulativeTypicalVolume += typicalPrice * candle.volume;
    cumulativeVolume += candle.volume;

    const value = cumulativeVolume === 0 
      ? typicalPrice 
      : cumulativeTypicalVolume / cumulativeVolume;

    vwap.push({
      time: candle.time,
      value: parseFloat(value.toFixed(4)),
    });
  }

  return vwap;
}

/**
 * Calculates Volume Profile (Horizontal Volume Bars at different price bins)
 */
export function calculateVolumeProfile(
  candles: Candle[],
  numBins = 24
): VolumeProfileBin[] {
  if (candles.length === 0) return [];

  // 1. Find min and max price bounds
  let minPrice = Infinity;
  let maxPrice = -Infinity;

  for (const candle of candles) {
    if (candle.low < minPrice) minPrice = candle.low;
    if (candle.high > maxPrice) maxPrice = candle.high;
  }

  if (minPrice === maxPrice) {
    return [{ price: minPrice, volume: candles.reduce((sum, c) => sum + c.volume, 0), isPoc: true }];
  }

  const binSize = (maxPrice - minPrice) / numBins;
  const bins: VolumeProfileBin[] = Array.from({ length: numBins }, (_, index) => {
    // Representative price is middle of the bin
    const price = minPrice + index * binSize + binSize / 2;
    return {
      price: parseFloat(price.toFixed(4)),
      volume: 0,
      isPoc: false,
    };
  });

  // 2. Assign volume of each candle to price bins it covers
  for (const candle of candles) {
    const cHigh = candle.high;
    const cLow = candle.low;
    const cVol = candle.volume;

    // Simple typical price assignment: assign full volume to typical price bin
    // A more advanced profile distributes volume across all bins spanned by high-low,
    // but typical price is fast and reliable. Let's do typical price for absolute performance:
    const typical = (cHigh + cLow + candle.close) / 3;
    const binIndex = Math.min(
      numBins - 1,
      Math.max(0, Math.floor((typical - minPrice) / binSize))
    );
    bins[binIndex].volume += cVol;
  }

  // 3. Find Point of Control (POC) — the bin with highest volume
  let maxVolume = -1;
  let pocIndex = 0;

  for (let i = 0; i < bins.length; i++) {
    if (bins[i].volume > maxVolume) {
      maxVolume = bins[i].volume;
      pocIndex = i;
    }
  }

  if (bins.length > 0 && maxVolume > 0) {
    bins[pocIndex].isPoc = true;
  }

  return bins;
}

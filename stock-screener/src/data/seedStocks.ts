import type {
  Stock,
  Sector,
  Exchange,
  MarketCapCategory,
  Candle,
} from "@/types/stock";

// ─────────────────────────────────────────────────────────────────────────────
//  LCG Seedable Random Number Generator (Deterministic & Extremely Fast)
// ─────────────────────────────────────────────────────────────────────────────
class SeededRandom {
  private seed: number;

  constructor(seed = 42) {
    this.seed = seed;
  }

  // 32-bit LCG
  next(): number {
    this.seed = (this.seed * 1664525 + 1013904223) % 4294967296;
    return this.seed / 4294967296;
  }

  float(min: number, max: number, fractionDigits = 2): number {
    const val = min + this.next() * (max - min);
    const multiplier = Math.pow(10, fractionDigits);
    return Math.round(val * multiplier) / multiplier;
  }

  int(min: number, max: number): number {
    return Math.floor(min + this.next() * (max - min + 1));
  }

  element<T>(arr: T[]): T {
    return arr[this.int(0, arr.length - 1)];
  }

  alpha(length: number): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let res = "";
    for (let i = 0; i < length; i++) {
      res += chars[this.int(0, chars.length - 1)];
    }
    return res;
  }

  numeric(length: number): string {
    let res = "";
    for (let i = 0; i < length; i++) {
      res += this.int(0, 9).toString();
    }
    return res;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  Sector → Industry mapping
// ─────────────────────────────────────────────────────────────────────────────
const SECTOR_INDUSTRY_MAP: Record<Sector, string[]> = {
  Technology: [
    "Software",
    "Semiconductors",
    "Cloud Computing",
    "Cybersecurity",
    "Hardware",
    "IT Services",
    "Artificial Intelligence",
  ],
  Healthcare: [
    "Biotechnology",
    "Pharmaceuticals",
    "Medical Devices",
    "Health Services",
    "Genomics",
    "Diagnostics",
  ],
  Finance: [
    "Banking",
    "Insurance",
    "Asset Management",
    "Fintech",
    "Investment Banking",
    "REITs",
  ],
  Energy: [
    "Oil & Gas",
    "Renewable Energy",
    "Nuclear",
    "Pipeline & Transportation",
    "Coal",
  ],
  "Consumer Discretionary": [
    "E-Commerce",
    "Automotive",
    "Luxury Goods",
    "Restaurants",
    "Apparel & Footwear",
    "Leisure",
  ],
  "Consumer Staples": [
    "Food & Beverage",
    "Household Products",
    "Personal Care",
    "Tobacco",
    "Retail Grocery",
  ],
  Industrials: [
    "Aerospace & Defense",
    "Machinery",
    "Transportation",
    "Construction",
    "Electrical Equipment",
  ],
  Materials: [
    "Mining",
    "Chemicals",
    "Steel",
    "Paper & Packaging",
    "Precious Metals",
  ],
  "Real Estate": [
    "Commercial REIT",
    "Residential REIT",
    "Industrial REIT",
    "Real Estate Services",
  ],
  Utilities: [
    "Electric Utilities",
    "Water Utilities",
    "Gas Distribution",
    "Multi-Utilities",
  ],
  "Communication Services": [
    "Telecom",
    "Media & Entertainment",
    "Social Media",
    "Streaming",
    "Advertising",
  ],
};

const SECTORS = Object.keys(SECTOR_INDUSTRY_MAP) as Sector[];
const EXCHANGES: Exchange[] = ["NYSE", "NASDAQ", "AMEX", "OTC"];

// ─────────────────────────────────────────────────────────────────────────────
//  Company Name Vocabulary
// ─────────────────────────────────────────────────────────────────────────────
const COMPANY_PREFIXES = [
  "Alpha", "Apex", "Astra", "Aurora", "Beacon", "Blue", "Bridge", "Catalyst", 
  "Core", "Crest", "Crown", "Delta", "Echo", "Elite", "Empower", "Endeavor", 
  "Envision", "Epic", "Equinox", "Evergreen", "Evolution", "First", "Flux", 
  "Focus", "Fortress", "Forward", "Frontier", "Fusion", "Galaxy", "Genesis", 
  "Global", "Grid", "Halo", "Harbor", "Helix", "Horizon", "Icon", "Infinite", 
  "Insight", "Integra", "Iron", "Key", "Latitude", "Legacy", "Liberty", 
  "Link", "Matrix", "Meridian", "Milestone", "Momentum", "Nexus", "North", 
  "Nova", "Oak", "Omega", "Omni", "Optima", "Orbit", "Origin", "Pacific", 
  "Peak", "Pinnacle", "Pioneer", "Pivot", "Polaris", "Power", "Premier", 
  "Prime", "Prism", "Pulse", "Quantum", "Quest", "Radiant", "Redwood", 
  "Sovereign", "Spectra", "Spectrum", "Star", "Stellar", "Summit", "Synergy", 
  "Target", "Terra", "Titan", "Trilogy", "Trinity", "Vector", "Velocity", 
  "Vertex", "Vibrant", "Vanguard", "Vista", "Vortex", "Wave", "Zenith"
];

const COMPANY_MID = [
  "Analytics", "Bio", "Capital", "Communications", "Creative", "Data", 
  "Development", "Digital", "Dynamics", "Eco", "Energy", "Engineering", 
  "Enterprise", "Financial", "Genomics", "Health", "Industrial", 
  "Information", "Infrastructure", "Innovation", "Interactive", "Life", 
  "Logistics", "Media", "Medical", "Micro", "Macro", "Nano", "Network", 
  "Partners", "Pharma", "Precision", "Research", "Resource", "Science", 
  "Security", "Software", "Solutions", "Strategic", "Synergy", "Tech", 
  "Ventures", "Vision", "Wireless"
];

const COMPANY_SUFFIX = [
  "Corp", "Corporation", "Group", "Holdings", "Inc", "Incorporated", 
  "Industries", "Labs", "Laboratories", "Limited", "Ltd", "Partners", 
  "Systems", "Technologies", "Ventures"
];

function generateCompanyName(rng: SeededRandom): string {
  const prefix = rng.element(COMPANY_PREFIXES);
  const suffix = rng.element(COMPANY_SUFFIX);
  if (rng.next() < 0.6) {
    const mid = rng.element(COMPANY_MID);
    return `${prefix} ${mid} ${suffix}`;
  }
  return `${prefix} ${suffix}`;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Symbol generation helpers
// ─────────────────────────────────────────────────────────────────────────────
function generateSymbol(rng: SeededRandom, usedSymbols: Set<string>): string {
  const len = rng.element([3, 4, 4, 4, 5]);
  let sym: string;
  let attempts = 0;
  do {
    sym = rng.alpha(len);
    attempts++;
    if (attempts > 50) {
      sym = sym + rng.numeric(1);
    }
  } while (usedSymbols.has(sym));
  usedSymbols.add(sym);
  return sym;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Market Cap helpers
// ─────────────────────────────────────────────────────────────────────────────
function getMarketCapCategory(marketCap: number): MarketCapCategory {
  if (marketCap >= 200e9) return "Mega";
  if (marketCap >= 10e9) return "Large";
  if (marketCap >= 2e9) return "Mid";
  if (marketCap >= 300e6) return "Small";
  if (marketCap >= 50e6) return "Micro";
  return "Nano";
}

function generateMarketCap(rng: SeededRandom): number {
  const roll = rng.next();
  if (roll < 0.02) return rng.float(200e9, 3000e9, 0);   // Mega (~2%)
  if (roll < 0.10) return rng.float(10e9, 200e9, 0);     // Large (~8%)
  if (roll < 0.25) return rng.float(2e9, 10e9, 0);       // Mid (~15%)
  if (roll < 0.55) return rng.float(300e6, 2e9, 0);      // Small (~30%)
  if (roll < 0.80) return rng.float(50e6, 300e6, 0);     // Micro (~25%)
  return rng.float(1e6, 50e6, 0);                        // Nano (~20%)
}

function generatePrice(rng: SeededRandom, marketCap: number): number {
  const category = getMarketCapCategory(marketCap);
  switch (category) {
    case "Mega":  return rng.float(80, 1200, 2);
    case "Large": return rng.float(20, 800, 2);
    case "Mid":   return rng.float(5, 300, 2);
    case "Small": return rng.float(1, 100, 2);
    case "Micro": return rng.float(0.5, 20, 4);
    default:      return rng.float(0.01, 5, 4);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  OHLC helpers
// ─────────────────────────────────────────────────────────────────────────────
interface OhlcResult {
  open: number;
  high: number;
  low: number;
  close: number;
  price: number;
  change: number;
  changePercent: number;
}

function generateOhlc(rng: SeededRandom, price: number): OhlcResult {
  const volatility = rng.float(0.005, 0.04, 4);

  const close = parseFloat(
    (price * (1 + rng.float(-0.03, 0.03, 4))).toFixed(2)
  );

  const gapFactor = 1 + rng.float(-0.015, 0.015, 4);
  const open = parseFloat((close * gapFactor).toFixed(2));

  const driftFactor = 1 + rng.float(-volatility * 2, volatility * 2, 4);
  const currentPrice = parseFloat((open * driftFactor).toFixed(2));

  const sessionRange = Math.abs(currentPrice - open) + open * volatility;
  const high = parseFloat(
    (Math.max(open, currentPrice) + rng.float(0, sessionRange * 0.5, 4)).toFixed(2)
  );
  const low = parseFloat(
    (Math.min(open, currentPrice) - rng.float(0, sessionRange * 0.5, 4)).toFixed(2)
  );

  const change = parseFloat((currentPrice - close).toFixed(2));
  const changePercent = parseFloat(((change / close) * 100).toFixed(2));

  return { open, high, low, close, price: currentPrice, change, changePercent };
}

// ─────────────────────────────────────────────────────────────────────────────
//  Volume helpers
// ─────────────────────────────────────────────────────────────────────────────
function generateVolume(rng: SeededRandom, marketCap: number): { volume: number; avgVolume: number } {
  const category = getMarketCapCategory(marketCap);
  let avgVolume: number;
  switch (category) {
    case "Mega":  avgVolume = rng.int(5_000_000, 100_000_000); break;
    case "Large": avgVolume = rng.int(1_000_000, 20_000_000); break;
    case "Mid":   avgVolume = rng.int(200_000, 5_000_000); break;
    case "Small": avgVolume = rng.int(50_000, 1_000_000); break;
    case "Micro": avgVolume = rng.int(5_000, 200_000); break;
    default:      avgVolume = rng.int(100, 50_000); break;
  }
  const volumeFactor = rng.float(0.5, 2.0, 2);
  const volume = Math.floor(avgVolume * volumeFactor);
  return { volume, avgVolume };
}

// ─────────────────────────────────────────────────────────────────────────────
//  Technical indicators
// ─────────────────────────────────────────────────────────────────────────────
function generateRsi(rng: SeededRandom, changePercent: number): number {
  const midpoint = 50 + changePercent * 2;
  const clamped = Math.min(95, Math.max(5, midpoint));
  const noise = rng.float(-15, 15, 2);
  return parseFloat(Math.min(100, Math.max(0, clamped + noise)).toFixed(1));
}

function generateBeta(rng: SeededRandom, sector: Sector): number {
  const sectorBeta: Record<Sector, [number, number]> = {
    Technology: [0.9, 1.8],
    Healthcare: [0.5, 1.3],
    Finance: [0.8, 1.5],
    Energy: [0.7, 1.6],
    "Consumer Discretionary": [0.8, 1.6],
    "Consumer Staples": [0.3, 0.9],
    Industrials: [0.8, 1.4],
    Materials: [0.7, 1.5],
    "Real Estate": [0.5, 1.1],
    Utilities: [0.2, 0.7],
    "Communication Services": [0.7, 1.5],
  };
  const [min, max] = sectorBeta[sector];
  return parseFloat(rng.float(min, max, 2).toString());
}

function generatePE(rng: SeededRandom, sector: Sector, eps: number | null): number | null {
  if (eps === null || eps <= 0) return null;
  const sectorPE: Record<Sector, [number, number]> = {
    Technology: [15, 80],
    Healthcare: [10, 60],
    Finance: [8, 25],
    Energy: [6, 20],
    "Consumer Discretionary": [12, 50],
    "Consumer Staples": [15, 35],
    Industrials: [12, 35],
    Materials: [8, 28],
    "Real Estate": [20, 60],
    Utilities: [12, 28],
    "Communication Services": [14, 45],
  };
  const [min, max] = sectorPE[sector];
  return parseFloat(rng.float(min, max, 1).toString());
}

function generate52WeekRange(
  rng: SeededRandom,
  price: number
): { week52High: number; week52Low: number } {
  const rangeSize = rng.float(0.15, 0.70, 2);
  const week52High = parseFloat(
    (price * (1 + rng.float(0.02, rangeSize, 2))).toFixed(2)
  );
  const week52Low = parseFloat(
    (price * (1 - rng.float(0.02, rangeSize * 0.8, 2))).toFixed(2)
  );
  return { week52High, week52Low };
}

// ─────────────────────────────────────────────────────────────────────────────
//  Single stock record generator
// ─────────────────────────────────────────────────────────────────────────────
function generateStock(rng: SeededRandom, usedSymbols: Set<string>): Stock {
  const sector = rng.element(SECTORS);
  const industry = rng.element(SECTOR_INDUSTRY_MAP[sector]);
  const exchange = rng.element(EXCHANGES);

  const marketCap = generateMarketCap(rng);
  const marketCapCategory = getMarketCapCategory(marketCap);
  const basePrice = generatePrice(rng, marketCap);
  const { volume, avgVolume } = generateVolume(rng, marketCap);
  const { open, high, low, close, price, change, changePercent } = generateOhlc(rng, basePrice);
  const { week52High, week52Low } = generate52WeekRange(rng, price);

  const symbol = generateSymbol(rng, usedSymbols);
  const name = generateCompanyName(rng);

  const hasEps = rng.next() > 0.2;
  const eps = hasEps
    ? parseFloat(rng.float(-2, 30, 2).toString())
    : null;
  const pe = generatePE(rng, sector, eps);

  const hasPb = rng.next() > 0.05;
  const pb = hasPb
    ? parseFloat(
        (
          sector === "Technology" ? rng.float(2.0, 15.0, 2) :
          sector === "Finance" ? rng.float(0.5, 3.5, 2) :
          rng.float(1.0, 8.0, 2)
        ).toFixed(2)
      )
    : null;

  const hasRoe = rng.next() > 0.1;
  const roe = hasRoe
    ? parseFloat(
        (
          sector === "Technology" ? rng.float(5.0, 35.0, 2) :
          sector === "Utilities" ? rng.float(3.0, 15.0, 2) :
          rng.float(-10.0, 25.0, 2)
        ).toFixed(2)
      )
    : null;

  const hasDividend = rng.next() > 0.65;
  const dividendYield = hasDividend
    ? parseFloat(rng.float(0.1, 8.0, 2).toString())
    : null;

  const rsi = generateRsi(rng, changePercent);
  const beta = generateBeta(rng, sector);

  return {
    symbol,
    name,
    price,
    open,
    high,
    low,
    close,
    volume,
    avgVolume,
    marketCap,
    marketCapCategory,
    change,
    changePercent,
    sector,
    industry,
    exchange,
    pe,
    pb,
    eps,
    roe,
    dividendYield,
    week52High,
    week52Low,
    rsi,
    beta,
    lastUpdated: Date.now(),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
//  Public API — generate N stock records
// ─────────────────────────────────────────────────────────────────────────────
export function generateStocks(count = 5000, seed?: number): Stock[] {
  const rng = new SeededRandom(seed !== undefined ? seed : 42);
  const usedSymbols = new Set<string>();
  const stocks: Stock[] = [];

  for (let i = 0; i < count; i++) {
    stocks.push(generateStock(rng, usedSymbols));
  }

  return stocks;
}

// ─────────────────────────────────────────────────────────────────────────────
//  OHLCV candle generator
// ─────────────────────────────────────────────────────────────────────────────
export function generateCandleHistory(
  currentPrice: number,
  days = 365,
  seed?: number
): Candle[] {
  const rng = new SeededRandom(seed !== undefined ? seed : 12345);
  const candles: Candle[] = [];
  const msPerDay = 86_400_000;
  const now = Date.now();
  const startTs = now - days * msPerDay;

  let price = currentPrice;
  const volatility = rng.float(0.008, 0.03, 4);

  for (let d = days; d >= 0; d--) {
    const ts = Math.floor((startTs + d * msPerDay) / 1000);

    const open = parseFloat(price.toFixed(2));
    const drift = rng.float(-volatility, volatility, 4);
    const close = parseFloat((open * (1 + drift)).toFixed(2));
    const sessionVol = rng.float(volatility * 0.3, volatility, 4);
    const high = parseFloat((Math.max(open, close) * (1 + sessionVol * 0.5)).toFixed(2));
    const low = parseFloat((Math.min(open, close) * (1 - sessionVol * 0.5)).toFixed(2));
    const volume = rng.int(100_000, 50_000_000);

    candles.unshift({ time: ts, open, high, low, close, volume });
    price = open;
  }

  return candles;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Singleton cache
// ─────────────────────────────────────────────────────────────────────────────
let _cachedStocks: Stock[] | null = null;

export function getStockDataset(): Stock[] {
  if (!_cachedStocks) {
    _cachedStocks = generateStocks(5000, 42);
  }
  return _cachedStocks;
}

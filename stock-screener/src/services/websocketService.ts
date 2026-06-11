import type { Stock, StockPatch } from "@/types/stock";
import { useWebSocketStore } from "@/store/useWebSocketStore";
import { useStockStore } from "@/store/useStockStore";
import { useAlertStore } from "@/store/useAlertStore";

type PatchCallback = (patches: StockPatch[]) => void;

class WebSocketService {
  private static instance: WebSocketService | null = null;

  private socket: any = null; // Mock socket reference
  private callbacks = new Set<PatchCallback>();
  private simulationInterval: NodeJS.Timeout | null = null;
  private metricsInterval: NodeJS.Timeout | null = null;
  
  // Connection state
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private baseReconnectDelay = 1000; // 1 second
  private isExplicitlyClosed = false;

  // Simulation parameters
  private tickRateMs = 250; // Update a batch every 250ms
  private batchSize = 15; // Number of stocks updated per batch
  private msgCountInSecond = 0;

  private constructor() {}

  public static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  /**
   * Connects the mock WebSocket client.
   * Simulates full handshakes and status transitions with a small latency.
   */
  public connect(): void {
    const wsStore = useWebSocketStore.getState();
    if (wsStore.isConnected || wsStore.isConnecting) return;

    this.isExplicitlyClosed = false;
    wsStore.setConnecting(true);

    // Simulate network handshake delay
    setTimeout(() => {
      if (this.isExplicitlyClosed) return;

      // Successful simulated connection
      wsStore.setConnected(true);
      this.reconnectAttempts = 0;

      // Start simulating data updates
      this.startSimulation();
      this.startMetricsMonitor();

      // Push a system log
      useAlertStore.getState().pushAlert({
        symbol: "SYSTEM",
        condition: "UNUSUAL_ACTIVITY",
        severity: "info",
        message: "Real-time market stream connected via WebSocket.",
        value: 1,
      });

    }, 800); // 800ms initial connection delay
  }

  /**
   * Disconnects the socket simulation.
   */
  public disconnect(): void {
    this.isExplicitlyClosed = true;
    this.stopSimulation();
    this.stopMetricsMonitor();
    
    const wsStore = useWebSocketStore.getState();
    wsStore.setConnected(false);
    wsStore.setConnecting(false);

    useAlertStore.getState().pushAlert({
      symbol: "SYSTEM",
      condition: "UNUSUAL_ACTIVITY",
      severity: "warning",
      message: "Market stream disconnected.",
      value: 0,
    });
  }

  /**
   * Simulates a sudden drop in connection (unplanned disconnect)
   * to test the exponential backoff reconnection strategy.
   */
  public simulateNetworkDrop(): void {
    if (!useWebSocketStore.getState().isConnected) return;

    console.warn("[WS] Simulating unplanned network connection drop...");
    this.stopSimulation();
    this.stopMetricsMonitor();

    const wsStore = useWebSocketStore.getState();
    wsStore.setConnected(false);

    useAlertStore.getState().pushAlert({
      symbol: "SYSTEM",
      condition: "UNUSUAL_ACTIVITY",
      severity: "critical",
      message: "WebSocket connection lost. Reconnecting...",
      value: 0,
    });

    this.handleReconnect();
  }

  /**
   * Exponential backoff reconnect strategy
   */
  private handleReconnect(): void {
    if (this.isExplicitlyClosed) return;

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("[WS] Maximum reconnection attempts reached.");
      useAlertStore.getState().pushAlert({
        symbol: "SYSTEM",
        condition: "UNUSUAL_ACTIVITY",
        severity: "critical",
        message: "Failed to connect to market stream. Please refresh.",
        value: 0,
      });
      return;
    }

    const delay = this.baseReconnectDelay * Math.pow(2, this.reconnectAttempts);
    this.reconnectAttempts++;

    useWebSocketStore.getState().setConnecting(true);

    setTimeout(() => {
      if (this.isExplicitlyClosed) return;
      console.log(`[WS] Attempting reconnection (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      // Try to re-establish connection
      const wsStore = useWebSocketStore.getState();
      wsStore.setConnected(true);
      this.reconnectAttempts = 0;

      this.startSimulation();
      this.startMetricsMonitor();

      useAlertStore.getState().pushAlert({
        symbol: "SYSTEM",
        condition: "UNUSUAL_ACTIVITY",
        severity: "info",
        message: "Connection re-established. Market stream active.",
        value: 1,
      });
    }, delay);
  }

  /**
   * Register a callback to process stock patch updates
   */
  public onMessage(callback: PatchCallback): void {
    this.callbacks.add(callback);
  }

  /**
   * Unregister a patch callback
   */
  public offMessage(callback: PatchCallback): void {
    this.callbacks.delete(callback);
  }

  /**
   * Subscribe to a symbol (simulates filtering stream at server level)
   */
  public subscribeSymbol(symbol: string): void {
    useWebSocketStore.getState().subscribe(symbol);
  }

  /**
   * Unsubscribe from a symbol
   */
  public unsubscribeSymbol(symbol: string): void {
    useWebSocketStore.getState().unsubscribe(symbol);
  }

  /**
   * Starts the Geometric Brownian Motion stock generator simulation.
   */
  private startSimulation(): void {
    this.stopSimulation();

    // Standard Normal Distribution Box-Muller transform
    const randomNormal = (): number => {
      let u = 0, v = 0;
      while(u === 0) u = Math.random(); // Converting [0,1) to (0,1)
      while(v === 0) v = Math.random();
      return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    };

    this.simulationInterval = setInterval(() => {
      const stockStore = useStockStore.getState();
      const wsStore = useWebSocketStore.getState();

      const stocksArray = Array.from(stockStore.stocks.values());
      if (stocksArray.length === 0) return;

      const patches: StockPatch[] = [];
      const subscribed = wsStore.subscribedSymbols;

      // ── Correlated returns: Market & Sector shocks ──
      // Market drift and volatility shocks
      const rMarket = randomNormal() * 0.0002;
      
      // Sector returns mapping
      const sectorShocks: Record<string, number> = {
        Technology: randomNormal() * 0.0004,
        Healthcare: randomNormal() * 0.00025,
        Finance: randomNormal() * 0.0003,
        Energy: randomNormal() * 0.0005,
        "Consumer Discretionary": randomNormal() * 0.00035,
        "Consumer Staples": randomNormal() * 0.00015,
        Industrials: randomNormal() * 0.00025,
        Materials: randomNormal() * 0.0003,
        "Real Estate": randomNormal() * 0.0002,
        Utilities: randomNormal() * 0.0001,
        "Communication Services": randomNormal() * 0.00035,
      };

      // Select which stocks to update in this batch
      // Priorities: Always include the currently viewed/subscribed stock, then watchlists, then randoms
      const selectedViewedTicker = useStockStore.getState().selectedStock;
      const candidates: Stock[] = [];

      // 1. viewed ticker
      if (selectedViewedTicker) {
        const matchingStock = stockStore.stocks.get(selectedViewedTicker);
        if (matchingStock) candidates.push(matchingStock);
      }

      // 2. subscribed tickers
      subscribed.forEach((sym: string) => {
        if (sym !== selectedViewedTicker) {
          const s = stockStore.stocks.get(sym);
          if (s) candidates.push(s);
        }
      });

      // 3. Populate rest of batch randomly from the remaining universe
      const neededRandom = this.batchSize - candidates.length;
      if (neededRandom > 0) {
        for (let i = 0; i < neededRandom; i++) {
          const randomStock = stocksArray[Math.floor(Math.random() * stocksArray.length)];
          if (randomStock && !candidates.some((c: Stock) => c.symbol === randomStock.symbol)) {
            candidates.push(randomStock);
          }
        }
      }

      // ── Apply Geometric Brownian Motion to each candidate ──
      for (const stock of candidates) {
        const sectorFactor = sectorShocks[stock.sector] ?? 0;
        const idiosyncraticShock = randomNormal() * 0.0006;
        
        // Correlated return: r = beta * r_market + (1 - beta) * r_sector + epsilon
        const dailyReturn = (stock.beta * rMarket) + ((1 - stock.beta) * sectorFactor) + idiosyncraticShock;

        // Price GBM adjustment
        const newPrice = parseFloat((stock.price * (1 + dailyReturn)).toFixed(stock.price > 10 ? 2 : 4));
        if (newPrice <= 0.001) continue; // Avoid stocks becoming completely worthless

        // Compute high/low boundaries
        const high = parseFloat(Math.max(stock.high, newPrice).toFixed(stock.price > 10 ? 2 : 4));
        const low = parseFloat(Math.min(stock.low, newPrice).toFixed(stock.price > 10 ? 2 : 4));

        // Volume increment: active trading adds 100 to 5000 units
        const volDiff = Math.floor(Math.random() * 4900) + 100;
        const volume = stock.volume + volDiff;

        const change = parseFloat((newPrice - stock.close).toFixed(2));
        const changePercent = parseFloat(((change / stock.close) * 100).toFixed(2));

        const patch: StockPatch = {
          symbol: stock.symbol,
          price: newPrice,
          change,
          changePercent,
          volume,
          high,
          low,
          lastUpdated: Date.now(),
        };

        patches.push(patch);
        this.msgCountInSecond++;

        // ── Pushes Dynamic Alerts ──
        this.evaluateAlerts(stock, patch);
      }

      // Dispatch patches to subscribers
      this.callbacks.forEach((cb) => cb(patches));
      
      // Increment global processed count
      useWebSocketStore.getState().incrementProcessedCount(patches.length);

    }, this.tickRateMs);
  }

  private stopSimulation(): void {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
  }

  /**
   * Periodically monitors the live message throughput and ping latency.
   */
  private startMetricsMonitor(): void {
    this.stopMetricsMonitor();

    this.metricsInterval = setInterval(() => {
      const wsStore = useWebSocketStore.getState();

      // Simulated network ping latency: drifts between 15ms and 65ms
      const simulatedLatency = Math.floor(Math.random() * 50) + 15;
      
      wsStore.updateMetrics({
        throughput: this.msgCountInSecond,
        latency: simulatedLatency,
      });

      this.msgCountInSecond = 0;
    }, 1000); // Calculate every second
  }

  private stopMetricsMonitor(): void {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }
  }

  /**
   * Dynamic alerts evaluation: Pushes standard warning signals into the user alert queue.
   */
  private evaluateAlerts(stock: Stock, patch: StockPatch): void {
    const alertStore = useAlertStore.getState();

    // 1. Extreme Price Surge (> 4%)
    if (patch.changePercent >= 4.0 && stock.changePercent < 4.0) {
      alertStore.pushAlert({
        symbol: stock.symbol,
        condition: "PRICE_UP",
        severity: "warning",
        message: `${stock.symbol} surged over 4% today, reaching $${patch.price}.`,
        value: patch.changePercent,
      });
    }

    // 2. Extreme Price Crash (< -4%)
    if (patch.changePercent <= -4.0 && stock.changePercent > -4.0) {
      alertStore.pushAlert({
        symbol: stock.symbol,
        condition: "PRICE_DOWN",
        severity: "critical",
        message: `${stock.symbol} dropped over 4% today, crashing to $${patch.price}.`,
        value: patch.changePercent,
      });
    }

    // 3. New 52-Week High
    if (patch.price > stock.week52High) {
      alertStore.pushAlert({
        symbol: stock.symbol,
        condition: "52W_HIGH",
        severity: "info",
        message: `${stock.symbol} hit a new 52-week high of $${patch.price}!`,
        value: patch.price,
      });
      // Update high reference locally as well
      stock.week52High = patch.price;
    }

    // 4. New 52-Week Low
    if (patch.price < stock.week52Low) {
      alertStore.pushAlert({
        symbol: stock.symbol,
        condition: "52W_LOW",
        severity: "warning",
        message: `${stock.symbol} hit a new 52-week low of $${patch.price}!`,
        value: patch.price,
      });
      stock.week52Low = patch.price;
    }

    // 5. Volume Spike (exceeds 3x average daily volume)
    if (patch.volume > stock.avgVolume * 3 && stock.volume <= stock.avgVolume * 3) {
      alertStore.pushAlert({
        symbol: stock.symbol,
        condition: "VOLUME_SPIKE",
        severity: "info",
        message: `${stock.symbol} experienced an extreme volume spike exceeding 3x average volume.`,
        value: patch.volume,
      });
    }
  }
}

export const wsService = WebSocketService.getInstance();
export default wsService;

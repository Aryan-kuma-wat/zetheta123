import { create } from "zustand";

interface WebSocketMetrics {
  latency: number; // Ping time in ms
  throughput: number; // Message updates processed per second
  totalMessagesProcessed: number;
}

interface WebSocketState {
  isConnected: boolean;
  isConnecting: boolean;
  metrics: WebSocketMetrics;
  subscribedSymbols: Set<string>;
}

interface WebSocketActions {
  setConnected: (connected: boolean) => void;
  setConnecting: (connecting: boolean) => void;
  updateMetrics: (patch: Partial<WebSocketMetrics>) => void;
  incrementProcessedCount: (amount?: number) => void;
  subscribe: (symbol: string) => void;
  unsubscribe: (symbol: string) => void;
  clearSubscriptions: () => void;
}

export const useWebSocketStore = create<WebSocketState & WebSocketActions>()((set, get) => ({
  // ── Initial State ───────────────────────────
  isConnected: false,
  isConnecting: false,
  metrics: {
    latency: 0,
    throughput: 0,
    totalMessagesProcessed: 0,
  },
  subscribedSymbols: new Set<string>(),

  // ── Actions ─────────────────────────────────
  setConnected: (isConnected) => {
    set({ isConnected, isConnecting: false });
  },

  setConnecting: (isConnecting) => {
    set({ isConnecting });
  },

  updateMetrics: (patch) => {
    set((s) => ({
      metrics: {
        ...s.metrics,
        ...patch,
      },
    }));
  },

  incrementProcessedCount: (amount = 1) => {
    set((s) => ({
      metrics: {
        ...s.metrics,
        totalMessagesProcessed: s.metrics.totalMessagesProcessed + amount,
      },
    }));
  },

  subscribe: (symbol) => {
    set((s) => {
      const next = new Set(s.subscribedSymbols);
      next.add(symbol);
      return { subscribedSymbols: next };
    });
  },

  unsubscribe: (symbol) => {
    set((s) => {
      const next = new Set(s.subscribedSymbols);
      next.delete(symbol);
      return { subscribedSymbols: next };
    });
  },

  clearSubscriptions: () => {
    set({ subscribedSymbols: new Set<string>() });
  },
}));

// ── Selectors ────────────────────────────────
export const selectIsConnected = (s: WebSocketState & WebSocketActions) => s.isConnected;
export const selectIsConnecting = (s: WebSocketState & WebSocketActions) => s.isConnecting;
export const selectWebSocketMetrics = (s: WebSocketState & WebSocketActions) => s.metrics;
export const selectSubscribedSymbols = (s: WebSocketState & WebSocketActions) => s.subscribedSymbols;
export const selectIsSubscribed = (symbol: string) => (s: WebSocketState & WebSocketActions) => s.subscribedSymbols.has(symbol);

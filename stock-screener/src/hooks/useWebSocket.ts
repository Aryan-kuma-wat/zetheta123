import { useEffect, useRef } from "react";
import { wsService } from "@/services/websocketService";
import { useWebSocketStore } from "@/store/useWebSocketStore";
import { useStockStore } from "@/store/useStockStore";
import type { StockPatch } from "@/types/stock";

/**
 * Hook to manage real-time WebSocket connection and batch incoming updates.
 * Leverages requestAnimationFrame (RAF) to buffer high-frequency ticks
 * and update state at 60fps (or capped intervals), maintaining maximum render performance.
 */
export function useWebSocket() {
  const isConnected = useWebSocketStore((s: any) => s.isConnected);
  const isConnecting = useWebSocketStore((s: any) => s.isConnecting);
  const metrics = useWebSocketStore((s: any) => s.metrics);
  const updateStocksBatch = useStockStore((s: any) => s.updateStocksBatch);

  // Buffer queue to store incoming patches before they are flushed
  const patchQueue = useRef<StockPatch[]>([]);
  // Store the active animation frame ID
  const rafId = useRef<number | null>(null);
  
  // Track last flush timestamp to allow throttling if needed (e.g. max 10 updates/sec to protect CPU)
  const lastFlushTime = useRef<number>(0);
  const FLUSH_INTERVAL_MS = 100; // Batch updates every 100ms for optimal balancing of latency and performance

  useEffect(() => {
    // 1. Automatically connect the market stream on mount
    wsService.connect();

    // 2. Queue-based animation frame tick
    const tick = (timestamp: number) => {
      // Throttle flushes to avoid hammering the JS main thread
      if (timestamp - lastFlushTime.current >= FLUSH_INTERVAL_MS) {
        if (patchQueue.current.length > 0) {
          // Dequeue current batch
          const batch = [...patchQueue.current];
          patchQueue.current = [];

          // Flush to Zustand in a single atomic batch update
          updateStocksBatch(batch);
          lastFlushTime.current = timestamp;
        }
      }

      // Continue the render loop
      rafId.current = requestAnimationFrame(tick);
    };

    // Listen to real-time updates
    const handleWebSocketMessage = (patches: StockPatch[]) => {
      // Accumulate in buffer
      patchQueue.current.push(...patches);
    };

    wsService.onMessage(handleWebSocketMessage);
    rafId.current = requestAnimationFrame(tick);

    // 3. Cleanup on unmount
    return () => {
      wsService.offMessage(handleWebSocketMessage);
      
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }

      // Explicitly disconnect stream when completely navigating away from dashboard
      wsService.disconnect();
    };
  }, [updateStocksBatch]);

  return {
    isConnected,
    isConnecting,
    metrics,
    // Connect utilities
    connect: () => wsService.connect(),
    disconnect: () => wsService.disconnect(),
    simulateDrop: () => wsService.simulateNetworkDrop(),
    subscribe: (sym: string) => wsService.subscribeSymbol(sym),
    unsubscribe: (sym: string) => wsService.unsubscribeSymbol(sym),
  };
}

export default useWebSocket;

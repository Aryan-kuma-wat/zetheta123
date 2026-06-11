import { create } from "zustand";
import { nanoid } from "nanoid";
import type { Alert, AlertCondition, AlertSeverity } from "@/types/alert";

/** Maximum alerts kept in the queue (oldest evicted first) */
const MAX_ALERTS = 200;

interface AlertState {
  alerts: Alert[];
  unreadCount: number;
}

interface AlertActions {
  pushAlert: (payload: Omit<Alert, "id" | "timestamp" | "read">) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  dismissAlert: (id: string) => void;
  clearAll: () => void;
}

export const useAlertStore = create<AlertState & AlertActions>()((set) => ({
  alerts: [],
  unreadCount: 0,

  pushAlert: (payload) =>
    set((s) => {
      const alert: Alert = {
        ...payload,
        id: nanoid(),
        timestamp: Date.now(),
        read: false,
      };
      // Bounded FIFO — evict oldest if at capacity
      const next = [alert, ...s.alerts].slice(0, MAX_ALERTS);
      return { alerts: next, unreadCount: s.unreadCount + 1 };
    }),

  markRead: (id) =>
    set((s) => ({
      alerts: s.alerts.map((a) => (a.id === id ? { ...a, read: true } : a)),
      unreadCount: Math.max(0, s.unreadCount - 1),
    })),

  markAllRead: () =>
    set((s) => ({
      alerts: s.alerts.map((a) => ({ ...a, read: true })),
      unreadCount: 0,
    })),

  dismissAlert: (id) =>
    set((s) => {
      const dismissed = s.alerts.find((a) => a.id === id);
      return {
        alerts: s.alerts.filter((a) => a.id !== id),
        unreadCount: dismissed && !dismissed.read
          ? Math.max(0, s.unreadCount - 1)
          : s.unreadCount,
      };
    }),

  clearAll: () => set({ alerts: [], unreadCount: 0 }),
}));

export const selectAlerts = (s: AlertState & AlertActions) => s.alerts;
export const selectUnreadCount = (s: AlertState & AlertActions) => s.unreadCount;
export const selectUnreadAlerts = (s: AlertState & AlertActions) =>
  s.alerts.filter((a) => !a.read);
export const selectRecentAlerts = (n: number) => (s: AlertState & AlertActions) =>
  s.alerts.slice(0, n);

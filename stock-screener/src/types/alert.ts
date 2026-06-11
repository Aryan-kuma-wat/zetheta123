// ─────────────────────────────────────────────
//  Alert types
// ─────────────────────────────────────────────

export type AlertSeverity = "info" | "warning" | "critical";

export type AlertCondition =
  | "PRICE_UP"
  | "PRICE_DOWN"
  | "VOLUME_SPIKE"
  | "RSI_OVERBOUGHT"
  | "RSI_OVERSOLD"
  | "52W_HIGH"
  | "52W_LOW"
  | "UNUSUAL_ACTIVITY";

export interface Alert {
  id: string;
  symbol: string;
  condition: AlertCondition;
  severity: AlertSeverity;
  message: string;
  /** The trigger value, e.g. the RSI reading or price */
  value: number;
  /** Unix timestamp ms */
  timestamp: number;
  read: boolean;
}

export const ALERT_CONDITION_LABELS: Record<AlertCondition, string> = {
  PRICE_UP: "Price Surge",
  PRICE_DOWN: "Price Drop",
  VOLUME_SPIKE: "Volume Spike",
  RSI_OVERBOUGHT: "RSI Overbought",
  RSI_OVERSOLD: "RSI Oversold",
  "52W_HIGH": "52-Week High",
  "52W_LOW": "52-Week Low",
  UNUSUAL_ACTIVITY: "Unusual Activity",
};

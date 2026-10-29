import type { OrderStatus } from "./types";

/**
 * Ordinal ramp for the five workshop stations (one hue, light → dark), validated with the dataviz palette
 * checker against the admin surface #f7f5f0: monotone lightness, visible step gaps, light end ≥ 2:1.
 */
export const STATION_COLORS: Partial<Record<OrderStatus, string>> = {
  PAID_NEW: "#8ab6a9",
  ASSIGNED_TO_M20: "#649789",
  ENGRAVING: "#3e786a",
  FINISHING_ULTRASONIC: "#105b4d",
  PACKAGING: "#004031",
};

/** Single-series bar colour (slot 1) for magnitude charts. */
export const BAR_COLOR = "#3e786a";

export const COURIERS = ["FAN Courier", "Cargus", "Sameday", "DPD", "GLS", "Poșta Română"];

const day = new Intl.DateTimeFormat("ro-RO", { day: "numeric", month: "short", timeZone: "Europe/Bucharest" });
const dayTime = new Intl.DateTimeFormat("ro-RO", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Bucharest",
});

export const formatDay = (date: Date) => day.format(date);
export const formatDayTime = (date: Date) => dayTime.format(date);

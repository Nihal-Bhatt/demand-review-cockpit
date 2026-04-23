import raw from "./thresholds.json";

export type ThresholdConfig = typeof raw;

export const thresholds = raw as ThresholdConfig;

export function utilizationTone(utilization: number): "red" | "amber" | "green" | "blue" {
  if (utilization > thresholds.capacity.overUtilization) return "red";
  if (utilization >= thresholds.capacity.tightUtilization) return "amber";
  if (utilization < thresholds.capacity.underUtilization) return "blue";
  return "green";
}

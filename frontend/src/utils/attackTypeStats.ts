import type { TrafficLog } from "../types/TrafficLog";
import { chartColors } from "../theme/humberTheme";

export const ATTACK_TYPE_CHART = [
  { key: "dos", label: "DoS", color: chartColors.gold },
  { key: "port_scan", label: "Port Scan", color: chartColors.white },
  { key: "ml_anomaly", label: "ML Anomaly", color: chartColors.goldDark },
] as const;

export type AttackTypeCounts = {
  dos: number;
  port_scan: number;
  ml_anomaly: number;
};

export const EMPTY_ATTACK_TYPE_COUNTS: AttackTypeCounts = {
  dos: 0,
  port_scan: 0,
  ml_anomaly: 0,
};

export function buildAttackTypeChartData(counts: AttackTypeCounts): {
  labels: string[];
  values: number[];
  colors: string[];
} {
  const entries = ATTACK_TYPE_CHART.map(({ key, label, color }) => ({
    label,
    value: counts[key] ?? 0,
    color,
  })).filter((entry) => entry.value > 0);

  return {
    labels: entries.map((entry) => entry.label),
    values: entries.map((entry) => entry.value),
    colors: entries.map((entry) => entry.color),
  };
}

export function countAttackTypesFromLogs(logs: TrafficLog[]): AttackTypeCounts {
  const counts: AttackTypeCounts = { ...EMPTY_ATTACK_TYPE_COUNTS };

  for (const log of logs) {
    if (log.prediction !== "Suspicious") continue;
    if (log.attack_type === "dos") counts.dos += 1;
    else if (log.attack_type === "port_scan") counts.port_scan += 1;
    else if (log.attack_type === "ml_anomaly") counts.ml_anomaly += 1;
  }

  return counts;
}

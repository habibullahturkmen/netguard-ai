import type { TrafficLog } from "../types/TrafficLog";

export const getDashboardStats = (
  logs: TrafficLog[]
) => {

  const total = logs.length;

  const suspicious =
    logs.filter(
      l => l.prediction === "Suspicious"
    ).length;

  const normal =
    logs.filter(
      l => l.prediction === "Normal"
    ).length;

  const avgSrcBytes =
    total > 0
      ? Math.round(
        logs.reduce(
          (sum, log) =>
            sum + Number(log.src_bytes),
          0
        ) / total
      )
      : 0;

  const avgDstBytes =
    total > 0
      ? Math.round(
        logs.reduce(
          (sum, log) =>
            sum + Number(log.dst_bytes),
          0
        ) / total
      )
      : 0;

  return {
    total,
    suspicious,
    normal,
    avgSrcBytes,
    avgDstBytes,
  };
};

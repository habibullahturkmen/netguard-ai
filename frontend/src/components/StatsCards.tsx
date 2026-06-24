import type { TrafficLog } from "../types/TrafficLog";
import { getDashboardStats } from "../utils/dashboardStats";

interface Props {
  logs: TrafficLog[];
  compact?: boolean;
  summary?: {
    total: number;
    normal: number;
    suspicious: number;
  };
}

function StatIcon({ type }: { type: "total" | "normal" | "suspicious" }) {
  if (type === "total") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
    );
  }
  if (type === "normal") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

export default function StatsCards({ logs, compact = false, summary }: Props) {
  const stats = getDashboardStats(logs);
  const total = summary?.total ?? stats.total;
  const normal = summary?.normal ?? stats.normal;
  const suspicious = summary?.suspicious ?? stats.suspicious;

  const cards = [
    { key: "total", label: "Total Logs", value: total.toLocaleString(), type: "total" as const },
    { key: "normal", label: "Normal", value: normal.toLocaleString(), type: "normal" as const },
    { key: "suspicious", label: "Suspicious", value: suspicious.toLocaleString(), type: "suspicious" as const },
  ];

  if (!compact) {
    cards.push(
      { key: "src", label: "Avg Src Bytes", value: String(stats.avgSrcBytes), type: "total" as const },
      { key: "dst", label: "Avg Dst Bytes", value: String(stats.avgDstBytes), type: "normal" as const },
    );
  }

  return (
    <div className={`stats-container${compact ? "" : " stats-container-extended"}`}>
      {cards.map(({ key, label, value, type }) => (
        <div key={key} className="stat-card">
          <div>
            <h3>{label}</h3>
            <p className="stat-value">{value}</p>
          </div>
          <div className="stat-icon">
            <StatIcon type={type} />
          </div>
        </div>
      ))}
    </div>
  );
}

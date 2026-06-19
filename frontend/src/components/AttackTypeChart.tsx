import type { TrafficLog } from "../types/TrafficLog";
import { formatAttackType } from "../types/TrafficLog";
import PieChart from "./PieChart";

interface Props {
  logs: TrafficLog[];
}

export default function AttackTypeChart({ logs }: Props) {
  const suspicious = logs.filter((l) => l.prediction === "Suspicious");
  const counts: Record<string, number> = {};

  for (const log of suspicious) {
    const label = formatAttackType(log.attack_type);
    if (label === "—") continue;
    counts[label] = (counts[label] ?? 0) + 1;
  }

  const labels = Object.keys(counts);
  const values = Object.values(counts);

  if (labels.length === 0) {
    return (
      <div className="chart-panel">
        <h3 className="chart-panel-title">Attack Type Distribution</h3>
        <p className="empty-hint">No suspicious traffic recorded yet.</p>
      </div>
    );
  }

  return (
    <PieChart
      title="Attack Type Distribution"
      labels={labels}
      values={values}
      variant="panel"
    />
  );
}

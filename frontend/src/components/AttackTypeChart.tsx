import type { TrafficLog } from "../types/TrafficLog";
import {
  type AttackTypeCounts,
  buildAttackTypeChartData,
  countAttackTypesFromLogs,
} from "../utils/attackTypeStats";
import PieChart from "./PieChart";

interface Props {
  logs: TrafficLog[];
  attackTypes?: AttackTypeCounts;
}

export default function AttackTypeChart({ logs, attackTypes }: Props) {
  const counts = attackTypes ?? countAttackTypesFromLogs(logs);
  const { labels, values, colors } = buildAttackTypeChartData(counts);

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
      colors={colors}
      variant="panel"
    />
  );
}

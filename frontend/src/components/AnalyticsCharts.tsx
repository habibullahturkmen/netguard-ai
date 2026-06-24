import type { AttackTypeCounts } from "../utils/attackTypeStats";
import type { TrafficLog } from "../types/TrafficLog";
import AttackTypeChart from "./AttackTypeChart";
import PieChart from "./PieChart";

interface Props {
  logs: TrafficLog[];
  attackTypes?: AttackTypeCounts;
}

export default function AnalyticsCharts({ logs, attackTypes }: Props) {
  const protocolCounts = logs.reduce(
    (acc, log) => {
      acc[log.protocol_type] = (acc[log.protocol_type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const serviceCounts = logs.reduce(
    (acc, log) => {
      acc[log.service] = (acc[log.service] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const flagCounts = logs.reduce(
    (acc, log) => {
      acc[log.flag] = (acc[log.flag] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const statusCounts = {
    Normal: logs.filter((l) => l.prediction === "Normal").length,
    Suspicious: logs.filter((l) => l.prediction === "Suspicious").length,
  };

  return (
    <div className="analytics-grid">
      <PieChart
        title="Log Classification"
        labels={Object.keys(statusCounts)}
        values={Object.values(statusCounts)}
        variant="panel"
      />
      <AttackTypeChart logs={logs} attackTypes={attackTypes} />
      <PieChart
        title="Protocol Types"
        labels={Object.keys(protocolCounts)}
        values={Object.values(protocolCounts)}
        variant="panel"
      />
      <PieChart
        title="Services"
        labels={Object.keys(serviceCounts)}
        values={Object.values(serviceCounts)}
        variant="panel"
      />
      <PieChart
        title="Flags"
        labels={Object.keys(flagCounts)}
        values={Object.values(flagCounts)}
        variant="panel"
      />
    </div>
  );
}

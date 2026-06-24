import AttackTypeChart from "../components/AttackTypeChart";
import LogsOverTimeChart from "../components/LogsOverTimeChart";
import PieChart from "../components/PieChart";
import RecentPredictionsTable from "../components/RecentPredictionsTable";
import StatsCards from "../components/StatsCards";
import { useLogsRecent } from "../hooks/useLogsRecent";

export default function OverviewPage() {
  const { logs, total, normal, suspicious, attackTypes } = useLogsRecent();

  return (
    <div className="page">
      <StatsCards logs={logs} compact summary={{ total, normal, suspicious }} />

      <div className="overview-charts">
        <LogsOverTimeChart logs={logs} />
        <PieChart
          title="Log Classification"
          labels={["Normal", "Suspicious"]}
          values={[normal, suspicious]}
          variant="panel"
        />
        <AttackTypeChart logs={logs} attackTypes={attackTypes} />
      </div>

      <RecentPredictionsTable logs={logs} />
    </div>
  );
}

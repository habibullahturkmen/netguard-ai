import PageHeader from "../components/PageHeader";
import AnalyticsCharts from "../components/AnalyticsCharts";
import { useLogsRecent } from "../hooks/useLogsRecent";

export default function AnalyticsPage() {
  const { logs, attackTypes } = useLogsRecent();

  return (
    <div className="page">
      <PageHeader
        title="Analytics"
        description="Breakdown by status, protocol, service, and TCP flags."
      />
      <AnalyticsCharts logs={logs} attackTypes={attackTypes} />
    </div>
  );
}

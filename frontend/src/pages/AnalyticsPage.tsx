import PageHeader from "../components/PageHeader";
import AnalyticsCharts from "../components/AnalyticsCharts";
import { useLogsRecent } from "../hooks/useLogsRecent";

export default function AnalyticsPage() {
  const { logs } = useLogsRecent();

  return (
    <div className="page">
      <PageHeader
        title="Analytics"
        description="Breakdown by status, protocol, service, and TCP flags."
      />
      <AnalyticsCharts logs={logs} />
    </div>
  );
}

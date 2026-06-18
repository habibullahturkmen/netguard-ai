import PageHeader from "../components/PageHeader";
import StatsCards from "../components/StatsCards";
import { useLogsRecent } from "../hooks/useLogsRecent";

export default function OverviewPage() {
  const { logs } = useLogsRecent();

  return (
    <div className="page">
      <PageHeader
        title="Overview"
        description="Summary statistics from the latest captured traffic."
      />
      <StatsCards logs={logs} />
    </div>
  );
}

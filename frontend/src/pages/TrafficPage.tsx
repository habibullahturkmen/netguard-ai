import PageHeader from "../components/PageHeader";
import TrafficChart from "../components/TrafficChart";
import { useLogsRecent } from "../hooks/useLogsRecent";

export default function TrafficPage() {
  const { logs } = useLogsRecent();

  return (
    <div className="page">
      <PageHeader
        title="Traffic"
        description="Normal vs suspicious traffic distribution."
      />
      <TrafficChart logs={logs} />
    </div>
  );
}

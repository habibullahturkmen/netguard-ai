import PageHeader from "../components/PageHeader";
import AlertsTable from "../components/AlertsTable";
import { useAlerts } from "../hooks/useAlerts";

export default function AlertsPage() {
  const { alerts } = useAlerts();

  return (
    <div className="page">
      <PageHeader
        title="Alerts"
        description="Confirmed suspicious events after consecutive detections."
      />
      <AlertsTable alerts={alerts} />
    </div>
  );
}

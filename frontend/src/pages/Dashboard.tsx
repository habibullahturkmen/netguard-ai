import { useEffect, useState } from "react";
import { fetchAlerts, fetchLogsRecent } from "../api/logApi";
import type { Alert, TrafficLog } from "../types/TrafficLog";
import StatsCards from "../components/StatsCards";
import LogsTable from "../components/LogsTable";
import AlertsTable from "../components/AlertsTable";
import TrafficChart from "../components/TrafficChart";
import AnalyticsCharts from "../components/AnalyticsCharts.tsx";

import "../styles/dashboard.css";

export default function Dashboard() {
  const [logs, setLogs] = useState<TrafficLog[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [logData, alertData] = await Promise.all([fetchLogsRecent(), fetchAlerts()]);
        setLogs(logData);
        setAlerts(alertData);
      } catch {
        // keep existing data on transient fetch failures
      }
    };

    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="dashboard">
      <h1>🛡️ NetGuard AI Dashboard</h1>

      <StatsCards logs={logs} />
      <TrafficChart logs={logs} />
      <AnalyticsCharts logs={logs} />

      <AlertsTable alerts={alerts} />
      <LogsTable />
    </div>
  );
}

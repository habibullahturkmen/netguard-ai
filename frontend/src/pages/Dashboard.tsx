import { useEffect, useState, } from "react";
import { fetchLogs, } from "../api/logApi";
import type { TrafficLog, } from "../types/TrafficLog";
import StatsCards from "../components/StatsCards";
import LogsTable from "../components/LogsTable";
import TrafficChart from "../components/TrafficChart";
import AnalyticsCharts from "../components/AnalyticsCharts.tsx"

import "../styles/dashboard.css";

export default function Dashboard() {

  const [logs, setLogs] =
    useState<TrafficLog[]>([]);

  const loadLogs = async () => {

    const data =
      await fetchLogs();

    setLogs(data);
  };

  useEffect(() => {

    loadLogs();

  }, []);

  return (
    <div className="dashboard">

      <h1>
        🛡️ NetGuard AI Dashboard
      </h1>

      {/*<div className="overview-section">*/}
        <StatsCards logs={logs} />

        <TrafficChart logs={logs} />
      {/*</div>*/}

      <AnalyticsCharts logs={logs}/>

      <LogsTable
        logs={logs}
      />

    </div>
  );
}

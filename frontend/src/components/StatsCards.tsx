import type { TrafficLog } from "../types/TrafficLog";
import { getDashboardStats } from "../utils/dashboardStats";

interface Props {
  logs: TrafficLog[];
}

export default function StatsCards({
                                     logs,
                                   }: Props) {

  const stats =
    getDashboardStats(logs);

  return (

    <div className="stats-container">

      <div className="card">
        <h3>Total Logs</h3>
        <p>{stats.total}</p>
      </div>

      <div className="card">
        <h3>Normal</h3>
        <p>{stats.normal}</p>
      </div>

      <div className="card">
        <h3>Suspicious</h3>
        <p>{stats.suspicious}</p>
      </div>

      <div className="card">
        <h3>Avg Src Bytes</h3>
        <p>{stats.avgSrcBytes}</p>
      </div>

      <div className="card">
        <h3>Avg Dst Bytes</h3>
        <p>{stats.avgDstBytes}</p>
      </div>

    </div>
  );
}

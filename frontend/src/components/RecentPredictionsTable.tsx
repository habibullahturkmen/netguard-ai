import type { TrafficLog } from "../types/TrafficLog";
import { formatAttackType } from "../types/TrafficLog";

interface Props {
  logs: TrafficLog[];
  limit?: number;
}

export default function RecentPredictionsTable({ logs, limit = 8 }: Props) {
  const recent = logs.slice(0, limit);

  return (
    <div className="table-wrapper table-wrapper-dark">
      <h3 className="section-title">Recent Predictions</h3>
      <table>
        <thead>
          <tr>
            <th>Source</th>
            <th>Destination</th>
            <th>Prediction</th>
            <th>Attack Type</th>
            <th>Attack Prob.</th>
          </tr>
        </thead>
        <tbody>
          {recent.length === 0 ? (
            <tr>
              <td colSpan={5} className="empty-row">
                No traffic logs yet.
              </td>
            </tr>
          ) : (
            recent.map((log) => (
              <tr key={log.id}>
                <td>{log.source_ip}</td>
                <td>{log.destination_ip}</td>
                <td className={log.prediction === "Suspicious" ? "suspicious" : "normal"}>
                  {log.prediction}
                </td>
                <td>{formatAttackType(log.attack_type)}</td>
                <td>{Number(log.confidence).toFixed(2)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

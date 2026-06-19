import type { Alert } from "../types/TrafficLog";
import { formatAttackType } from "../types/TrafficLog";

interface Props {
  alerts: Alert[];
}

export default function AlertsTable({ alerts }: Props) {
  return (
    <div className="table-wrapper table-wrapper-dark">
      <h3 className="section-title">Alerts</h3>
      {alerts.length === 0 ? (
        <p className="empty-hint">No alerts yet. Trigger 3 consecutive suspicious events to the same destination.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Source</th>
              <th>Destination</th>
              <th>Attack Type</th>
              <th>Attack Prob.</th>
              <th>Service</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {alerts.map((alert) => (
              <tr key={alert.id}>
                <td>{alert.id}</td>
                <td>{alert.source_ip}</td>
                <td>{alert.destination_ip}</td>
                <td className="suspicious">{formatAttackType(alert.attack_type)}</td>
                <td>{(Number(alert.confidence) * 100).toFixed(1)}%</td>
                <td>{alert.service}</td>
                <td>{new Date(alert.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

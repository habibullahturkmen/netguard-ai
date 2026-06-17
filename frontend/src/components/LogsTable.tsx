import type { TrafficLog } from "../types/TrafficLog";
import { formatAttackType } from "../types/TrafficLog";

interface Props {
  logs: TrafficLog[];
}

export default function LogsTable({ logs }: Props) {
  return (
    <div className="table-wrapper">
      <h2>Traffic Logs</h2>
      <table border={1}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Source</th>
            <th>Destination</th>
            <th>Prediction</th>
            <th>Attack Type</th>
            <th>Attack Prob.</th>
            <th>Protocol</th>
            <th>Service</th>
            <th>Count</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id}>
              <td>{log.id}</td>
              <td>{log.source_ip}</td>
              <td>{log.destination_ip}</td>
              <td className={log.prediction === "Suspicious" ? "suspicious" : "normal"}>
                {log.prediction}
              </td>
              <td className={log.attack_type && log.attack_type !== "none" ? "suspicious" : ""}>
                {formatAttackType(log.attack_type)}
              </td>
              <td>{(Number(log.confidence) * 100).toFixed(1)}%</td>
              <td>{log.protocol_type ?? log.protocol}</td>
              <td>{log.service}</td>
              <td>{log.duration}</td>
              <td>{new Date(log.created_at).toLocaleTimeString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

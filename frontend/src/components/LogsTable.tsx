import type { TrafficLog } from "../types/TrafficLog";

interface Props {
  logs: TrafficLog[];
}

export default function LogsTable({
  logs,
}: Props) {
  return (
    <table border={1}>
      <thead>
      <tr>
        <th>ID</th>
        <th>Source</th>
        <th>Destination</th>
        <th>Protocol</th>
        <th>Prediction</th>
        <th>Confidence</th>
        <th>Duration</th>
        <th>Protocol Type</th>
        <th>Service</th>
        <th>Flag</th>
        <th>Src Bytes</th>
        <th>Dst Bytes</th>
      </tr>
      </thead>

      <tbody>

      {logs.map(log => (
        <tr key={log.id}>
          <td>{log.id}</td>
          <td>{log.source_ip}</td>
          <td>{log.destination_ip}</td>
          <td>{log.protocol}</td>
          <td
            className={
              log.prediction === "Suspicious"
                ? "suspicious"
                : "normal"
            }
          >
            {log.prediction}
          </td>
          <td>{log.confidence}</td>
          <td>{log.duration}</td>
          <td>{log.protocol_type}</td>
          <td>{log.service}</td>
          <td>{log.flag}</td>
          <td>{log.src_bytes}</td>
          <td>{log.dst_bytes}</td>
        </tr>
      ))}

      </tbody>
    </table>
  );
}

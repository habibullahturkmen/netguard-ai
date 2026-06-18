import { useCallback, useEffect, useState } from "react";
import { fetchLogsPage } from "../api/logApi";
import type { TrafficLog } from "../types/TrafficLog";
import { formatAttackType } from "../types/TrafficLog";

const PAGE_SIZE = 20;

export default function LogsTable() {
  const [logs, setLogs] = useState<TrafficLog[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const loadPage = useCallback(async (targetPage: number) => {
    try {
      const result = await fetchLogsPage(targetPage, PAGE_SIZE);
      setLogs(result.data);
      setPage(result.page);
      setTotalPages(result.totalPages);
      setTotal(result.total);
    } catch {
      // keep existing rows on transient fetch failures
    }
  }, []);

  useEffect(() => {
    loadPage(page);
    const interval = setInterval(() => loadPage(page), 5000);
    return () => clearInterval(interval);
  }, [page, loadPage]);

  const rangeStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, total);

  return (
    <div className="table-wrapper">
      <div className="table-toolbar">
        <span className="table-meta">
          {total === 0
            ? "No logs"
            : `Showing ${rangeStart}–${rangeEnd} of ${total}`}
        </span>
      </div>

      <table>
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
          {logs.length === 0 ? (
            <tr>
              <td colSpan={10} className="empty-row">
                No traffic logs yet.
              </td>
            </tr>
          ) : (
            logs.map((log) => (
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
            ))
          )}
        </tbody>
      </table>

      <div className="pagination">
        <button
          type="button"
          className="pagination-btn"
          disabled={page <= 1}
          onClick={() => setPage((p) => p - 1)}
        >
          Previous
        </button>
        <span className="pagination-info">
          Page {page} of {totalPages}
        </span>
        <button
          type="button"
          className="pagination-btn"
          disabled={page >= totalPages}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}

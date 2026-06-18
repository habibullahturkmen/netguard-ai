import { useEffect, useState } from "react";
import { fetchLogsRecent } from "../api/logApi";
import type { TrafficLog } from "../types/TrafficLog";

export function useLogsRecent(limit = 500) {
  const [logs, setLogs] = useState<TrafficLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchLogsRecent(limit);
        setLogs(data);
      } catch {
        // keep existing data on transient failures
      } finally {
        setLoading(false);
      }
    };

    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [limit]);

  return { logs, loading };
}

import { useEffect, useState } from "react";
import { fetchAlerts } from "../api/logApi";
import type { Alert } from "../types/TrafficLog";

export function useAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchAlerts();
        setAlerts(data);
      } catch {
        // keep existing data on transient failures
      } finally {
        setLoading(false);
      }
    };

    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  return { alerts, loading };
}

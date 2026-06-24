import { useEffect, useState } from "react";
import { fetchLogsRecent } from "../api/logApi";
import type { TrafficLog } from "../types/TrafficLog";
import {
  type AttackTypeCounts,
  EMPTY_ATTACK_TYPE_COUNTS,
} from "../utils/attackTypeStats";

export function useLogsRecent(limit = 500) {
  const [logs, setLogs] = useState<TrafficLog[]>([]);
  const [total, setTotal] = useState(0);
  const [normal, setNormal] = useState(0);
  const [suspicious, setSuspicious] = useState(0);
  const [attackTypes, setAttackTypes] = useState<AttackTypeCounts>(EMPTY_ATTACK_TYPE_COUNTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const result = await fetchLogsRecent(limit);
        setLogs(result.data);
        setTotal(result.total);
        setNormal(result.normal);
        setSuspicious(result.suspicious);
        setAttackTypes(result.attackTypes);
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

  return { logs, total, normal, suspicious, attackTypes, loading };
}

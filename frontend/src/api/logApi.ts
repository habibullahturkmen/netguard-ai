import axios from "axios";
import type { Alert, TrafficLog } from "../types/TrafficLog";
import {
  type AttackTypeCounts,
  EMPTY_ATTACK_TYPE_COUNTS,
  countAttackTypesFromLogs,
} from "../utils/attackTypeStats";

const apiBase = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");

export interface PaginatedLogs {
  data: TrafficLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface RecentLogsResult {
  data: TrafficLog[];
  total: number;
  normal: number;
  suspicious: number;
  attackTypes: AttackTypeCounts;
}

export const fetchLogsRecent = async (limit = 500): Promise<RecentLogsResult> => {
  const response = await axios.get(`${apiBase}/api/logs`, { params: { recent: limit } });
  const payload = response.data;
  if (Array.isArray(payload)) {
    const normal = payload.filter((l: TrafficLog) => l.prediction === "Normal").length;
    const suspicious = payload.filter((l: TrafficLog) => l.prediction === "Suspicious").length;
    return {
      data: payload,
      total: payload.length,
      normal,
      suspicious,
      attackTypes: countAttackTypesFromLogs(payload),
    };
  }
  return {
    ...(payload as Omit<RecentLogsResult, "attackTypes">),
    attackTypes: payload.attackTypes ?? EMPTY_ATTACK_TYPE_COUNTS,
  };
};

export const fetchLogsPage = async (page = 1, limit = 20): Promise<PaginatedLogs> => {
  const response = await axios.get(`${apiBase}/api/logs`, { params: { page, limit } });
  return response.data;
};

export const fetchAlerts = async (): Promise<Alert[]> => {
  const response = await axios.get(`${apiBase}/api/alerts`);
  return response.data;
};

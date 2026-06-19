import axios from "axios";
import type { Alert, TrafficLog } from "../types/TrafficLog";

const apiBase = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");

export interface PaginatedLogs {
  data: TrafficLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const fetchLogsRecent = async (limit = 500): Promise<TrafficLog[]> => {
  const response = await axios.get(`${apiBase}/api/logs`, { params: { recent: limit } });
  return response.data;
};

export const fetchLogsPage = async (page = 1, limit = 20): Promise<PaginatedLogs> => {
  const response = await axios.get(`${apiBase}/api/logs`, { params: { page, limit } });
  return response.data;
};

export const fetchAlerts = async (): Promise<Alert[]> => {
  const response = await axios.get(`${apiBase}/api/alerts`);
  return response.data;
};

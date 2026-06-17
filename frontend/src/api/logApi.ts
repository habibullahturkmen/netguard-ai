import axios from "axios";
import type { Alert } from "../types/TrafficLog";

const apiBase = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");

export const fetchLogs = async () => {
  const response = await axios.get(`${apiBase}/api/logs`);
  return response.data;
};

export const fetchAlerts = async (): Promise<Alert[]> => {
  const response = await axios.get(`${apiBase}/api/alerts`);
  return response.data;
};

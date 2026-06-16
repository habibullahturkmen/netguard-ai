import axios from "axios";

const apiBase = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");

export const fetchLogs = async () => {
  const response = await axios.get(`${apiBase}/api/logs`);
  return response.data;
};

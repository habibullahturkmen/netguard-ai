import axios from "axios";

export const fetchLogs = async () => {
  const response = await axios.get(
    "http://localhost:5000/api/logs"
  );

  return response.data;
};

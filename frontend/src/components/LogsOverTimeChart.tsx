import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import type { TrafficLog } from "../types/TrafficLog";
import { chartColors, chartDefaults } from "../theme/humberTheme";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface Props {
  logs: TrafficLog[];
}

function bucketByDay(logs: TrafficLog[]) {
  const buckets = new Map<string, { normal: number; suspicious: number }>();

  for (const log of logs) {
    const day = new Date(log.created_at).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
    const entry = buckets.get(day) ?? { normal: 0, suspicious: 0 };
    if (log.prediction === "Suspicious") {
      entry.suspicious += 1;
    } else {
      entry.normal += 1;
    }
    buckets.set(day, entry);
  }

  const labels = [...buckets.keys()].slice(-7);
  return {
    labels,
    normal: labels.map((l) => buckets.get(l)?.normal ?? 0),
    suspicious: labels.map((l) => buckets.get(l)?.suspicious ?? 0),
  };
}

export default function LogsOverTimeChart({ logs }: Props) {
  const { labels, normal, suspicious } = bucketByDay(logs);

  const data = {
    labels,
    datasets: [
      {
        label: "Normal",
        data: normal,
        backgroundColor: chartColors.gold,
        borderRadius: 4,
      },
      {
        label: "Suspicious",
        data: suspicious,
        backgroundColor: chartColors.white,
        borderRadius: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        labels: { color: chartDefaults.color },
      },
    },
    scales: {
      x: {
        stacked: true,
        ticks: { color: chartDefaults.color },
        grid: { color: chartDefaults.borderColor },
      },
      y: {
        stacked: true,
        ticks: { color: chartDefaults.color },
        grid: { color: chartDefaults.borderColor },
      },
    },
  };

  return (
    <div className="chart-panel">
      <h3 className="chart-panel-title">Logs Over Time</h3>
      <Bar data={data} options={options} />
    </div>
  );
}

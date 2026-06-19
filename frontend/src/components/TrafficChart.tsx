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

export default function TrafficChart({ logs }: Props) {
  const suspicious = logs.filter((log) => log.prediction === "Suspicious").length;
  const normal = logs.length - suspicious;

  const data = {
    labels: ["Normal", "Suspicious"],
    datasets: [
      {
        label: "Traffic Count",
        data: [normal, suspicious],
        backgroundColor: [chartColors.gold, chartColors.white],
        borderRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: {
        ticks: { color: chartDefaults.color },
        grid: { color: chartDefaults.borderColor },
      },
      y: {
        ticks: { color: chartDefaults.color },
        grid: { color: chartDefaults.borderColor },
      },
    },
  };

  return (
    <div className="chart-panel">
      <h3 className="chart-panel-title">Traffic Distribution</h3>
      <Bar data={data} options={options} />
    </div>
  );
}

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

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface Props {
  logs: TrafficLog[];
}

export default function TrafficChart({
                                       logs,
                                     }: Props) {

  const suspicious =
    logs.filter(
      log =>
        log.prediction ===
        "Suspicious"
    ).length;

  const normal =
    logs.length - suspicious;

  const data = {
    labels: [
      "Normal",
      "Suspicious",
    ],

    datasets: [
      {
        label: "Traffic Count",
        data: [
          normal,
          suspicious,
        ],
      },
    ],
  };

  return (
    <div className="chart-container">

      <Bar data={data} />

    </div>
  );
}

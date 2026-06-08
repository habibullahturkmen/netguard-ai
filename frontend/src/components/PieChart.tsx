import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from "chart.js";

import { Pie } from "react-chartjs-2";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
);

interface Props {
  title: string;
  labels: string[];
  values: number[];
}

export default function PieChart({
  title,
  labels,
  values
}: Props) {

  const data = {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: [
          "#2563eb",
          "#16a34a",
          "#dc2626",
          "#f59e0b",
          "#8b5cf6",
          "#06b6d4",
          "#ec4899"
        ]
      }
    ]
  };

  return (

    <div className="chart-card">

      <h3>{title}</h3>

      <Pie data={data}/>

    </div>
  );
}

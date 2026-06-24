import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Pie } from "react-chartjs-2";
import { chartDefaults, piePalette } from "../theme/humberTheme";

ChartJS.register(ArcElement, Tooltip, Legend);

interface Props {
  title: string;
  labels: string[];
  values: number[];
  variant?: "card" | "panel";
  colors?: string[];
}

export default function PieChart({
  title,
  labels,
  values,
  variant = "card",
  colors: colorsProp,
}: Props) {
  const colors = colorsProp ?? piePalette.slice(0, labels.length);

  const data = {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: colors,
        borderColor: "rgba(0, 0, 51, 0.4)",
        borderWidth: 2,
      },
    ],
  };

  const options = {
    plugins: {
      legend: {
        labels: {
          color: chartDefaults.color,
          padding: 14,
        },
      },
    },
  };

  const wrapperClass = variant === "panel" ? "chart-panel" : "chart-card";

  return (
    <div className={wrapperClass}>
      <h3 className={variant === "panel" ? "chart-panel-title" : undefined}>{title}</h3>
      <Pie data={data} options={options} />
    </div>
  );
}

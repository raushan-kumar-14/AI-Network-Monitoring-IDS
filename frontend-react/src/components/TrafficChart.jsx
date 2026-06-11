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

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

function TrafficChart({
  normalCount,
  suspiciousCount,
  scanCount,
}) {
  const data = {
    labels: [
      "Normal",
      "Suspicious",
      "Potential Scan",
    ],
    datasets: [
  {
    label: "Traffic Count",
    data: [normalCount, suspiciousCount, scanCount],
    backgroundColor: [
      "#22c55e",  // Normal - Green
      "#ef4444",  // Suspicious - Red
      "#f59e0b",  // Potential Scan - Orange
    ],
    borderColor: [
      "#16a34a",
      "#dc2626",
      "#d97706",
    ],
    borderWidth: 2,
    borderRadius: 8,
  },
],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "bottom",
      },
      title: {
        display: true,
        text: "Traffic Analysis",
      },
    },
  };

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <Bar data={data} options={options} />
    </div>
  );
}

export default TrafficChart;
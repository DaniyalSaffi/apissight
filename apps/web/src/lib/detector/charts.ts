/**
 * Charts for detector results, rendered with Chart.js (loaded on demand).
 * Charts describe only the current batch of analysed images; they are not
 * accuracy claims.
 */
import { isHealthyLabel, type HistoryItem } from "@apissight/core";

type ChartInstance = import("chart.js").Chart;

let charts: ChartInstance[] = [];

const COLORS = {
  honey: "#f5b301",
  ink: "#3a2f18",
  green: "#2e7d32",
  red: "#b3261e",
  grey: "#9e9e9e",
  amber: "#e65100",
};

function destroyCharts(): void {
  charts.forEach((chart) => chart.destroy());
  charts = [];
}

export async function renderCharts(
  items: HistoryItem[],
  healthyKeyword: string,
): Promise<void> {
  const { Chart, DoughnutController, BarController, ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend } =
    await import("chart.js");
  Chart.register(DoughnutController, BarController, ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);
  destroyCharts();

  const outcomesCanvas = document.getElementById("chart-outcomes") as HTMLCanvasElement | null;
  const diseaseCanvas = document.getElementById("chart-disease") as HTMLCanvasElement | null;
  const confidenceCanvas = document.getElementById("chart-confidence") as HTMLCanvasElement | null;
  if (!outcomesCanvas || !diseaseCanvas || !confidenceCanvas) return;

  let healthy = 0;
  let diseased = 0;
  let invalid = 0;
  const diseaseCounts = new Map<string, number>();
  let stage1Sum = 0;
  let stage2Sum = 0;
  let stage2Count = 0;
  for (const item of items) {
    stage1Sum += item.stage1Confidence;
    if (!item.valid) {
      invalid += 1;
      continue;
    }
    if (item.stage2 !== null) {
      stage2Sum += item.stage2Confidence ?? 0;
      stage2Count += 1;
      diseaseCounts.set(item.stage2, (diseaseCounts.get(item.stage2) ?? 0) + 1);
      if (isHealthyLabel(item.stage2, healthyKeyword)) healthy += 1;
      else diseased += 1;
    }
  }
  const count = items.length || 1;

  charts.push(
    new Chart(outcomesCanvas, {
      type: "doughnut",
      data: {
        labels: ["Healthy", "Diseased", "Invalid image"],
        datasets: [{ data: [healthy, diseased, invalid], backgroundColor: [COLORS.green, COLORS.red, COLORS.grey] }],
      },
      options: { plugins: { legend: { position: "bottom" } } },
    }),
  );
  charts.push(
    new Chart(diseaseCanvas, {
      type: "bar",
      data: {
        labels: [...diseaseCounts.keys()],
        datasets: [{ label: "Images", data: [...diseaseCounts.values()], backgroundColor: COLORS.honey }],
      },
      options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } },
    }),
  );
  charts.push(
    new Chart(confidenceCanvas, {
      type: "bar",
      data: {
        labels: ["Stage 1 (avg)", "Stage 2 (avg)"],
        datasets: [
          {
            label: "Average confidence",
            data: [stage1Sum / count, stage2Count ? stage2Sum / stage2Count : 0],
            backgroundColor: [COLORS.ink, COLORS.amber],
          },
        ],
      },
      options: {
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, max: 1, ticks: { callback: (value) => `${Number(value) * 100}%` } } },
      },
    }),
  );
}

export function clearCharts(): void {
  destroyCharts();
}

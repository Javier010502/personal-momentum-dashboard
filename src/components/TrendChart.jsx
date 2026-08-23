import { useEffect, useRef } from 'react';
import { Chart, LineController, LineElement, PointElement, LinearScale, CategoryScale, Filler } from 'chart.js';

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Filler);

// Balance-trend area line. Colors are pulled from CSS variables at draw time so
// the chart follows light/dark mode. Re-renders when data or theme changes.
export default function TrendChart({ points, theme }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    const cs = getComputedStyle(document.documentElement);
    const accent = cs.getPropertyValue('--accent').trim();
    const ink = cs.getPropertyValue('--muted').trim();
    const grid = cs.getPropertyValue('--line').trim();

    const labels = points.map((p) => p.label);
    const data = points.map((p) => p.value);

    if (chartRef.current) chartRef.current.destroy();

    chartRef.current = new Chart(canvasRef.current, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            data,
            borderColor: accent,
            backgroundColor: hexToRgba(accent, 0.1),
            borderWidth: 2,
            fill: true,
            tension: 0.35,
            pointRadius: 0,
            pointHoverRadius: 4,
            pointHoverBackgroundColor: accent,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { enabled: true } },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: ink, font: { family: 'JetBrains Mono, monospace', size: 10 } },
            border: { display: false },
          },
          y: {
            grid: { color: grid, drawTicks: false },
            ticks: {
              color: ink,
              font: { family: 'JetBrains Mono, monospace', size: 10 },
              callback: (v) => `$${Math.round(v / 1000)}k`,
            },
            border: { display: false },
          },
        },
      },
    });

    return () => chartRef.current && chartRef.current.destroy();
  }, [points, theme]);

  return (
    <div className="chart">
      <canvas ref={canvasRef} height="130" />
    </div>
  );
}

// Chart.js wants rgba(); CSS vars arrive as hex. Cheap converter, no dep.
function hexToRgba(hex, a) {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  if ([r, g, b].some(Number.isNaN)) return `rgba(31,111,92,${a})`;
  return `rgba(${r},${g},${b},${a})`;
}

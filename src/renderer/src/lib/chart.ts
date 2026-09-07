// Shared chart theming so every recharts surface reads as one system.

export const chartColors = {
  primary: "#2563eb", // blue-600
  grid: "#e2e8f0", // slate-200
  axis: "#94a3b8", // slate-400
  critical: "#dc2626", // red-600
  high: "#d97706", // amber-600
  medium: "#f59e0b", // amber-500
  low: "#64748b", // slate-500
  success: "#059669", // emerald-600
} as const;

export const severityFill = (severity?: string): string => {
  switch (severity) {
    case "critical":
      return chartColors.critical;
    case "high":
      return chartColors.high;
    case "medium":
      return chartColors.medium;
    default:
      return chartColors.low;
  }
};

export const axisProps = {
  axisLine: false,
  tickLine: false,
  tick: { fontSize: 11, fill: chartColors.axis },
} as const;

export const gridProps = {
  strokeDasharray: "3 3",
  vertical: false,
  stroke: chartColors.grid,
} as const;

export const tooltipProps = {
  contentStyle: {
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    fontSize: "12px",
    fontWeight: 500,
    boxShadow: "0 4px 12px rgba(15,23,42,0.08)",
  },
  cursor: { fill: "#f1f5f9" },
} as const;

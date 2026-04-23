/** Hex values aligned with `tailwind.config.js` — use in Recharts where CSS classes do not apply. */
export const chartColors = {
  grid: "#595959",
  tick: "#BFBFBF",
  tickMuted: "#7F7F7F",
  tooltipBg: "#3F3F3F",
  tooltipBorder: "#595959",
  tooltipLabel: "#F2F2F2",
  /** Waterfall / bars */
  total: "#2A62B9",
  positive: "#529781",
  negative: "#EF8733",
  neutral: "#7F7F7F",
  /** Series */
  royal: "#2A62B9",
  royalSoft: "#5CA1F7",
  teal: "#529781",
  orange: "#EF8733",
  ice: "#649EC6",
  gold: "#F4BB43",
  scatter: "#649EC6",
  scatterAlt: "#EF8733",
  capacityDemand: "#2A62B9",
  capacityFeasible: "#649EC6",
} as const;

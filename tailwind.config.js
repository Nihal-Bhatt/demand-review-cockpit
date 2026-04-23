/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      colors: {
        surface: {
          black: "#000000",
          app: "#0C0C0C",
          charcoal: "#262626",
          inset: "#2E2E2E",
          panel: "#3F3F3F",
          border: "#595959",
          muted: "#7F7F7F",
          soft: "#A5A5A5",
          subtle: "#BFBFBF",
          dim: "#D8D8D8",
          hint: "#F2F2F2",
          on: "#FFFFFF",
          raised: "#262626",
        },
        accent: {
          royal: {
            DEFAULT: "#2A62B9",
            tint: "#C5DFFC",
            mid: "#8EC0FA",
            soft: "#5CA1F7",
            dark: "#1D4A8A",
            deep: "#11315C",
          },
          teal: {
            DEFAULT: "#529781",
            light: "#D7EEE8",
            mid: "#B0DED1",
            soft: "#8CCEBB",
            dark: "#3C7061",
            deep: "#274B40",
          },
          ice: {
            DEFAULT: "#649EC6",
            tint: "#DEEBF3",
            mid: "#BED8E7",
            soft: "#9FC5DC",
            dark: "#45799D",
            deep: "#2E5169",
          },
          orange: {
            DEFAULT: "#EF8733",
            tint: "#FBE6CF",
            mid: "#F6CEA0",
            soft: "#F4B572",
            dark: "#B36524",
            deep: "#774315",
          },
          gold: {
            DEFAULT: "#F4BB43",
            tint: "#FCF0D3",
            mid: "#FAE3A7",
            soft: "#F8D67E",
            dark: "#C29130",
            deep: "#81611D",
          },
        },
      },
      boxShadow: {
        soft: "0 1px 2px rgba(0, 0, 0, 0.45), 0 8px 24px rgba(0, 0, 0, 0.35)",
        lift: "0 1px 2px rgba(0, 0, 0, 0.5), 0 12px 40px rgba(0, 0, 0, 0.45)",
      },
    },
  },
  plugins: [],
};

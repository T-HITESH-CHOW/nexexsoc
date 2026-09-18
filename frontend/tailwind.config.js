/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        soc: {
          bg: "#050811",
          deep: "#020409",
          card: "#0A0F1D",
          surface: "#0E162B",
          panel: "#121C35",
          panelLight: "#182442",
          border: "#1E293B",
          borderLight: "#2D3E5D",
          borderCyan: "rgba(6, 182, 212, 0.3)",
          hover: "#15223E",
          critical: "#EF4444",
          criticalDark: "#7F1D1D",
          high: "#F97316",
          highDark: "#7C2D12",
          medium: "#F59E0B",
          low: "#10B981",
          info: "#64748B",
          cyan: "#06B6D4",
          cyanGlow: "rgba(6, 182, 212, 0.4)",
          purple: "#8B5CF6",
          blue: "#3B82F6"
        }
      },
      boxShadow: {
        'cyber-sm': '0 0 10px rgba(6, 182, 212, 0.1)',
        'cyber-md': '0 0 20px rgba(6, 182, 212, 0.2)',
        'glow-crit': '0 0 15px rgba(239, 68, 68, 0.3)',
        'glow-orange': '0 0 15px rgba(249, 115, 22, 0.3)',
        'glow-purple': '0 0 15px rgba(139, 92, 246, 0.3)',
      },
      keyframes: {
        'pulse-slow': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
        'radar-sweep': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        }
      },
      animation: {
        'pulse-slow': 'pulse-slow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'radar-sweep': 'radar-sweep 4s linear infinite',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif']
      }
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "primary": "#9A7310",
        "primary-hover": "#85620D",
        "secondary": "#735c12",
        "active-nav": "#D7B967",
        "brand-900": "#8F6B0A",
        "brand-soft": "#F7F0D8",
        "app-bg": "#F1F8FC",
        "background": "#F1F8FC",
        "surface": "#ffffff",
        "surface-muted": "#F8FAFC",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f0f4f8",
        "surface-container": "#eaeef2",
        "surface-container-high": "#e5e9ed",
        "surface-container-highest": "#dfe3e7",
        "surface-variant": "#dfe3e7",
        "surface-dim": "#d6dade",
        "surface-bright": "#f6fafe",
        "on-primary": "#ffffff",
        "on-secondary": "#ffffff",
        "on-surface": "#1F2937",
        "on-surface-variant": "#64748B",
        "on-background": "#1F2937",
        "border-base": "#E2E8F0",
        "border-input": "#CBD5E1",
        "outline": "#807664",
        "outline-variant": "#E2E8F0",
        "success": "#16A34A",
        "warning": "#D97706",
        "danger": "#DC2626",
        "info": "#2563EB",
        "error": "#DC2626",
        "inverse-surface": "#1F2937",
        "inverse-on-surface": "#F1F8FC",
        "primary-fixed": "#ffdea1",
        "primary-fixed-dim": "#efc05a",
        "on-primary-fixed": "#261900"
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        sm: "0.125rem",
        md: "0.375rem",
        lg: "0.5rem",
        xl: "0.75rem",
        full: "9999px"
      },
      spacing: {
        "sidebar-width": "220px",
        "header-height": "60px",
        "gutter": "24px",
        xs: "4px",
        sm: "8px",
        md: "16px",
        lg: "24px",
        xl: "40px",
        base: "4px"
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        "headline-sm": ["Inter", "sans-serif"],
        "table-cell": ["Inter", "sans-serif"],
        caption: ["Inter", "sans-serif"],
        "body-lg": ["Inter", "sans-serif"],
        display: ["Inter", "sans-serif"],
        "headline-md": ["Inter", "sans-serif"],
        "body-md": ["Inter", "sans-serif"],
        "headline-lg": ["Inter", "sans-serif"],
        "label-caps": ["Inter", "sans-serif"]
      },
      fontSize: {
        caption: ["12px", { lineHeight: "16px", fontWeight: "400" }],
        "headline-sm": ["16px", { lineHeight: "24px", fontWeight: "600" }],
        "table-cell": ["13px", { lineHeight: "18px", fontWeight: "400" }],
        "headline-md": ["20px", { lineHeight: "28px", fontWeight: "600" }],
        "headline-lg": ["24px", { lineHeight: "32px", fontWeight: "600" }],
        "body-md": ["14px", { lineHeight: "20px", fontWeight: "400" }],
        "label-caps": ["12px", { lineHeight: "16px", letterSpacing: "0.05em", fontWeight: "600" }],
        display: ["28px", { lineHeight: "36px", letterSpacing: "-0.02em", fontWeight: "700" }],
        "body-lg": ["16px", { lineHeight: "24px", fontWeight: "400" }]
      }
    }
  },
  plugins: [
    import('@tailwindcss/forms'),
    import('@tailwindcss/container-queries')
  ]
}

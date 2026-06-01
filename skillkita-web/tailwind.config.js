/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#8B1E1E",
          dark: "#6d1818",
        },
        secondary: {
          DEFAULT: "#C9A227",
        },
        paper: "#F7F6F3",
        ink: {
          DEFAULT: "#222222",
          muted: "#666666",
        },
        success: "#2E7D32",
      },
      fontFamily: {
        heading: ["Poppins", "ui-sans-serif", "system-ui", "sans-serif"],
        body: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      maxWidth: {
        content: "1400px",
      },
      borderRadius: {
        card: "12px",
        hero: "24px",
      },
      boxShadow: {
        card: "0 1px 3px rgba(0, 0, 0, 0.06), 0 4px 12px rgba(0, 0, 0, 0.04)",
      },
      height: {
        header: "72px",
      },
      spacing: {
        sidebar: "220px",
      },
      width: {
        sidebar: "220px",
      },
      screens: {
        xs: "640px",
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        val: {
          red: "#FF4655",
          "red-dark": "#BD3944",
          "red-glow": "rgba(255, 70, 85, 0.4)",
          cream: "#ECE8E1",
          teal: "#17DEA6",
          "teal-glow": "rgba(23, 222, 166, 0.4)",
          blue: "#0F1923",
          navy: "#1C2B3A",
        },
        rank: {
          ascendant: "#2DEB90",
          diamond: "#B489C4",
          platinum: "#59C8C8",
          gold: "#ECB940",
        },
        dark: {
          bg: "#0A1018",
          bg2: "#0F1923",
          card: "#141E29",
          "card-hover": "#1A2836",
        },
        glass: {
          bg: "rgba(20, 30, 41, 0.7)",
          border: "rgba(255, 70, 85, 0.12)",
        },
      },
      fontFamily: {
        heading: ["Orbitron", "sans-serif"],
        body: ["Inter", "-apple-system", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      animation: {
        float: "float 4s ease-in-out infinite",
        "fade-in-up": "fade-in-up 0.8s ease forwards",
        "fade-in-up-delay-1": "fade-in-up 0.8s ease 0.15s forwards",
        "fade-in-up-delay-2": "fade-in-up 0.8s ease 0.3s forwards",
        "fade-in-up-delay-3": "fade-in-up 0.8s ease 0.45s forwards",
        "pulse-glow": "pulse-glow 2s ease infinite",
        "gradient-shift": "gradient-shift 4s ease infinite",
        "scan-line": "scan-line 2s linear infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(30px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 20px rgba(255, 70, 85, 0.4)" },
          "50%": { boxShadow: "0 0 40px rgba(255, 70, 85, 0.4), 0 0 80px rgba(255, 70, 85, 0.1)" },
        },
        "gradient-shift": {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
        "scan-line": {
          "0%": { top: "-100%" },
          "100%": { top: "200%" },
        },
      },
    },
  },
  plugins: [],
};

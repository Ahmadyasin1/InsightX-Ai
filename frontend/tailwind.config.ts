import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Semantic tokens (switch per theme via CSS vars) ─────────────────
        background:  "var(--bg)",
        surface:     "var(--surface)",
        "surface-2": "var(--surface-2)",
        "surface-3": "var(--surface-3)",
        "surface-4": "var(--surface-4)",

        // Primary — Microsoft blue (light) / Violet (dark)
        primary: {
          DEFAULT: "var(--primary)",
          50:  "var(--primary-50)",
          100: "var(--primary-100)",
          200: "var(--primary-200)",
          300: "var(--primary-300)",
          400: "var(--primary-400)",
          500: "var(--primary-500)",
          600: "var(--primary-600)",
          700: "var(--primary-700)",
          glow: "var(--primary-glow)",
        },

        secondary: {
          DEFAULT: "var(--secondary)",
          400: "var(--secondary-400)",
          500: "var(--secondary-500)",
        },

        accent: {
          DEFAULT: "var(--accent)",
          400: "var(--accent-400)",
          500: "var(--accent-500)",
        },

        // Text hierarchy
        foreground:   "var(--text)",
        muted:        "var(--text-muted)",
        subtle:       "var(--text-subtle)",

        // Borders
        border: {
          DEFAULT: "var(--border)",
          strong:  "var(--border-strong)",
          subtle:  "var(--border-subtle)",
        },

        // Danger / Warning / Success
        danger:  { DEFAULT: "#EF4444", 400: "#f87171" },
        warning: { DEFAULT: "#F59E0B", 400: "#fbbf24" },
        success: { DEFAULT: "#10B981", 400: "#34d399" },
        gold:    { DEFAULT: "#F59E0B", 400: "#fbbf24" },

        // Keep hardcoded for components that need it
        "ms-blue":   "#0078D4",
        "ms-purple": "#6B46C1",
        "ms-cyan":   "#00BCF2",
      },

      fontFamily: {
        sans:    ["Inter", "system-ui", "sans-serif"],
        mono:    ["JetBrains Mono", "Fira Code", "monospace"],
        display: ["Inter", "system-ui", "sans-serif"],
      },

      fontSize: {
        "2xs": ["0.65rem", { lineHeight: "1rem" }],
      },

      backgroundImage: {
        "gradient-primary":  "linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)",
        "gradient-purple":   "linear-gradient(135deg, #7C3AED 0%, #4F46E5 50%, #06B6D4 100%)",
        "gradient-ms":       "linear-gradient(135deg, #0078D4 0%, #005a9e 100%)",
        "gradient-gold":     "linear-gradient(135deg, #F59E0B, #D97706)",
        "gradient-danger":   "linear-gradient(135deg, #EF4444, #DC2626)",
        "hero-mesh-dark":    [
          "radial-gradient(ellipse 100% 60% at 50% -10%, rgba(124,58,237,0.25), transparent)",
          "radial-gradient(ellipse 60% 40% at 80% 50%, rgba(6,182,212,0.06), transparent)",
        ].join(", "),
        "hero-mesh-light":   [
          "radial-gradient(ellipse 100% 60% at 50% -10%, rgba(0,120,212,0.08), transparent)",
          "radial-gradient(ellipse 60% 40% at 80% 50%, rgba(0,188,242,0.04), transparent)",
        ].join(", "),
        "glow-purple": "radial-gradient(circle at center, rgba(124,58,237,0.2), transparent 70%)",
        "glow-blue":   "radial-gradient(circle at center, rgba(0,120,212,0.15), transparent 70%)",
      },

      boxShadow: {
        // Premium elevation system
        "elev-1": "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)",
        "elev-2": "0 4px 12px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06)",
        "elev-3": "0 8px 24px rgba(0,0,0,0.12), 0 4px 8px rgba(0,0,0,0.08)",
        "elev-4": "0 16px 48px rgba(0,0,0,0.16), 0 8px 16px rgba(0,0,0,0.1)",
        "glass":       "0 8px 32px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.6)",
        "glass-dark":  "0 8px 32px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)",
        "glass-lg":    "0 16px 64px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.5)",
        "glow-sm":     "0 0 20px rgba(0,120,212,0.2)",
        "glow-md":     "0 0 40px rgba(0,120,212,0.25)",
        "glow-lg":     "0 0 80px rgba(0,120,212,0.2)",
        "glow-violet": "0 0 40px rgba(124,58,237,0.3)",
        "glow-violet-lg": "0 0 80px rgba(124,58,237,0.2)",
        "inner-glow":  "inset 0 1px 0 rgba(255,255,255,0.4)",
        "fluent":      "0 2px 8px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.06)",
        "fluent-hover":"0 4px 20px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.08)",
        "ms-card":     "0 2px 4px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06)",
        "ms-card-hover":"0 4px 8px rgba(0,0,0,0.06), 0 16px 48px rgba(0,0,0,0.10)",
      },

      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },

      transitionTimingFunction: {
        "spring":  "cubic-bezier(0.34, 1.56, 0.64, 1)",
        "smooth":  "cubic-bezier(0.4, 0, 0.2, 1)",
        "fluent":  "cubic-bezier(0.1, 0.9, 0.2, 1)",
      },

      animation: {
        "fade-in":     "fadeIn 0.4s ease-out forwards",
        "slide-up":    "slideUp 0.5s ease-out forwards",
        "slide-in-r":  "slideInRight 0.4s ease-out forwards",
        "float":       "float 6s ease-in-out infinite",
        "float-slow":  "float 9s ease-in-out infinite",
        "glow-pulse":  "glowPulse 3s ease-in-out infinite",
        "scan-line":   "scanLine 3s linear infinite",
        "shimmer":     "shimmer 2s linear infinite",
        "ping-slow":   "ping 2s cubic-bezier(0,0,0.2,1) infinite",
        "spin-slow":   "spin 8s linear infinite",
        "orb-breathe": "orbBreathe 6s ease-in-out infinite",
        "neural-pulse":"neuralPulse 2s ease-in-out infinite",
        "typewriter":  "typewriter 2s steps(20) forwards",
        "progress-fill":"progressFill 2s ease-out forwards",
      },

      keyframes: {
        fadeIn:      { from: { opacity: "0" }, to: { opacity: "1" } },
        slideUp:     { from: { opacity: "0", transform: "translateY(20px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        slideInRight:{ from: { opacity: "0", transform: "translateX(20px)" }, to: { opacity: "1", transform: "translateX(0)" } },
        float:       { "0%,100%": { transform: "translateY(0px)" }, "50%": { transform: "translateY(-14px)" } },
        glowPulse:   { "0%,100%": { opacity: "0.5", transform: "scale(1)" }, "50%": { opacity: "1", transform: "scale(1.05)" } },
        scanLine:    { from: { transform: "translateY(-100%)" }, to: { transform: "translateY(100vh)" } },
        shimmer:     { from: { backgroundPosition: "-200% 0" }, to: { backgroundPosition: "200% 0" } },
        orbBreathe:  { "0%,100%": { transform: "scale(1)", opacity: "0.4" }, "50%": { transform: "scale(1.12)", opacity: "0.7" } },
        neuralPulse: { "0%,100%": { opacity: "0.3", r: "3" }, "50%": { opacity: "1", r: "5" } },
        typewriter:  { from: { width: "0" }, to: { width: "100%" } },
        progressFill:{ from: { width: "0%" }, to: { width: "var(--target-width)" } },
      },

      backdropBlur: {
        xs: "4px",
      },
    },
  },
  plugins: [
    require("@tailwindcss/typography"),
  ],
};

export default config;

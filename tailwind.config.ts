import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1600px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        "google-blue": "hsl(var(--google-blue))",
        "google-red": "hsl(var(--google-red))",
        "google-yellow": "hsl(var(--google-yellow))",
        "google-green": "hsl(var(--google-green))",
        "google-grey": "hsl(var(--google-grey))",
        "google-white": "hsl(var(--google-white))",
        // Legacy support
        lime: {
          DEFAULT: "hsl(var(--google-blue))",
          glow: "hsl(var(--google-blue))",
          dark: "hsl(var(--google-blue))",
        },
        cream: {
          DEFAULT: "hsl(var(--google-white))",
          dark: "hsl(var(--google-white))",
        },
        carbon: {
          DEFAULT: "hsl(var(--google-grey))",
          light: "hsl(var(--google-grey))",
        },
        forest: "hsl(var(--google-green))",
        gold: "hsl(var(--google-yellow))",
        papaya: "hsl(var(--google-red))",
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      fontFamily: {
        display: ['Bebas Neue', 'sans-serif'],
        body: ['Space Grotesk', 'sans-serif'],
      },
      fontSize: {
        'display-xl': ['clamp(4rem, 15vw, 12rem)', { lineHeight: '0.9', letterSpacing: '0.02em' }],
        'display-lg': ['clamp(3rem, 10vw, 8rem)', { lineHeight: '0.95', letterSpacing: '0.02em' }],
        'display-md': ['clamp(2rem, 6vw, 5rem)', { lineHeight: '1', letterSpacing: '0.02em' }],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '30': '7.5rem',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0) rotate(0deg)" },
          "50%": { transform: "translateY(-30px) rotate(3deg)" },
        },
        "float-slow": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-15px)" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 30px hsl(var(--lime) / 0.3)" },
          "50%": { boxShadow: "0 0 60px hsl(var(--lime) / 0.5)" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(80px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-left": {
          from: { opacity: "0", transform: "translateX(-100px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "slide-in-right": {
          from: { opacity: "0", transform: "translateX(100px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "marquee": {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "marquee-reverse": {
          "0%": { transform: "translateX(-50%)" },
          "100%": { transform: "translateX(0)" },
        },
        "rotate-slow": {
          from: { transform: "rotateY(0deg)" },
          to: { transform: "rotateY(360deg)" },
        },
        "rotate-360": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        "blob-morph": {
          "0%, 100%": { borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%" },
          "25%": { borderRadius: "30% 60% 70% 40% / 50% 60% 30% 60%" },
          "50%": { borderRadius: "50% 50% 40% 60% / 40% 50% 60% 50%" },
          "75%": { borderRadius: "40% 60% 50% 50% / 60% 40% 50% 60%" },
        },
        "shimmer": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(30px) scale(0.98)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        "scale-in": {
          "0%": { transform: "scale(0.9)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "draw-line": {
          "0%": { strokeDashoffset: "1000" },
          "100%": { strokeDashoffset: "0" },
        },
        "number-count": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "50%": { opacity: "1" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "reveal-text": {
          "0%": { clipPath: "inset(0 100% 0 0)" },
          "100%": { clipPath: "inset(0 0 0 0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "float": "float 8s ease-in-out infinite",
        "float-slow": "float-slow 6s ease-in-out infinite",
        "pulse-glow": "pulse-glow 3s ease-in-out infinite",
        "slide-up": "slide-up 1s ease-out forwards",
        "slide-in-left": "slide-in-left 0.8s ease-out forwards",
        "slide-in-right": "slide-in-right 0.8s ease-out forwards",
        "marquee": "marquee 30s linear infinite",
        "marquee-reverse": "marquee-reverse 30s linear infinite",
        "rotate-slow": "rotate-slow 25s linear infinite",
        "rotate-360": "rotate-360 20s linear infinite",
        "blob-morph": "blob-morph 12s ease-in-out infinite",
        "shimmer": "shimmer 3s ease-in-out infinite",
        "fade-in": "fade-in 0.8s ease-out forwards",
        "scale-in": "scale-in 0.5s ease-out forwards",
        "draw-line": "draw-line 2s ease-out forwards",
        "reveal-text": "reveal-text 1s ease-out forwards",
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.23, 1, 0.32, 1)',
        'bounce-soft': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

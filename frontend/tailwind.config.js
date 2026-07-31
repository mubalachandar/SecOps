/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace']
      },
      colors: {
        page: { DEFAULT: '#08090c', light: '#f8fafc' },
        surface: { DEFAULT: '#13151b', light: '#ffffff' },
        surface2: { DEFAULT: '#191c24', light: '#f1f5f9' },
        raised: { DEFAULT: '#0e1015', light: '#f8fafc' },
        border: { DEFAULT: '#1f2229', light: '#e2e8f0' },
        'border-strong': { DEFAULT: '#2a2e38', light: '#cbd5e1' },
        /* ── Canvas / Surface System ─────────────────────────────── */
        canvas: {
          DEFAULT: '#08090c',       // page background – near-black with blue undertone
          raised: '#0e1015',        // sidebar / topbar background
          surface: '#13151b',       // card background
          'surface-2': '#191c24',   // nested / hover surface
          border: '#1f2229',        // default border
          'border-strong': '#2a2e38' // emphasized border
        },
        /* ── Accent (Brand Blue) ─────────────────────────────────── */
        accent: {
          DEFAULT: '#06b6d4',
          hover: '#6690ff',
          muted: 'rgba(6,182,212,0.12)',
          border: 'rgba(6,182,212,0.3)'
        },
        /* ── Severity Palette ────────────────────────────────────── */
        severity: {
          critical: '#f0384a',
          'critical-muted': 'rgba(240,56,74,0.12)',
          high: '#f5942e',
          'high-muted': 'rgba(245,148,46,0.12)',
          medium: '#f0c419',
          'medium-muted': 'rgba(240,196,25,0.12)',
          low: '#06b6d4',
          'low-muted': 'rgba(6,182,212,0.12)',
          info: '#8a93a6',
          'info-muted': 'rgba(138,147,166,0.12)'
        },
        /* ── Success ─────────────────────────────────────────────── */
        success: {
          DEFAULT: '#2fbf71',
          muted: 'rgba(47,191,113,0.12)'
        },
        /* ── Legacy aliases (keep for backward compat) ───────────── */
        primary: { 50: '#f8fafc', 100: '#f1f5f9', 200: '#e2e8f0', 300: '#cbd5e1', 400: '#94a3b8', 500: '#64748b', 600: '#475569', 700: '#334155', 800: '#1e293b', 900: '#0f172a', 950: '#020617' },
        danger: { 50: '#fef2f2', 100: '#fee2e2', 500: '#ef4444', 600: '#dc2626', 700: '#b91c1c', 900: '#7f1d1d' },
        warning: { 50: '#fffbeb', 100: '#fef3c7', 500: '#f59e0b', 600: '#d97706', 700: '#b45309', 900: '#78350f' },
        info: { 50: '#eff6ff', 100: '#dbeafe', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8', 900: '#1e3a8a' },
        background: { dark: '#0a0e1a', light: '#f8fafc' },
      }
    }
  },
  plugins: []
};

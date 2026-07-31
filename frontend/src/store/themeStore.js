import { create } from 'zustand';

// Helper to apply theme to document
const applyTheme = (theme) => {
  const root = document.documentElement;
  root.classList.remove('dark', 'light');
  root.classList.add(theme);
  localStorage.setItem('secops_theme', theme);
};

// Initialize theme immediately to prevent flash
const getInitialTheme = () => {
  const savedTheme = localStorage.getItem('secops_theme');
  if (savedTheme) {
    return savedTheme;
  }
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
};

const initialTheme = getInitialTheme();
applyTheme(initialTheme);

export const useThemeStore = create((set) => ({
  theme: initialTheme,
  
  setTheme: (theme) => {
    set({ theme });
    applyTheme(theme);
  },
  
  toggleTheme: () => set((state) => {
    const newTheme = state.theme === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
    return { theme: newTheme };
  }),
}));

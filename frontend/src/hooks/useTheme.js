import { useThemeStore } from '../store/themeStore';

export function useTheme() {
  const { theme, toggleTheme, setTheme } = useThemeStore();
  
  return {
    theme,
    isDark: theme === 'dark',
    isLight: theme === 'light',
    toggleTheme,
    setTheme
  };
}

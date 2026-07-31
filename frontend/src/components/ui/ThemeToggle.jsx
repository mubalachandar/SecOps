import React from 'react';
import { useTheme } from '../../hooks/useTheme';
import { Moon, Sun } from 'lucide-react';
import clsx from 'clsx';

export default function ThemeToggle({ size = 'md', className = '' }) {
  const { isDark, toggleTheme } = useTheme();

  const sizeClasses = {
    sm: { button: 'w-8 h-8', icon: 'w-4 h-4' },
    md: { button: 'w-10 h-10', icon: 'w-5 h-5' },
    lg: { button: 'w-12 h-12', icon: 'w-6 h-6' },
  };

  const currentSize = sizeClasses[size] || sizeClasses.md;

  return (
    <button
      onClick={toggleTheme}
      className={clsx(
        "rounded-lg border transition-all duration-300 flex items-center justify-center relative overflow-hidden",
        currentSize.button,
        isDark 
          ? "bg-slate-800 border-slate-700 hover:bg-slate-700 hover:border-slate-600 hover:bg-blue-500/10" 
          : "bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300 shadow-sm hover:bg-amber-500/10",
        className
      )}
      aria-label="Toggle theme"
    >
      <div 
        className={clsx(
          "absolute inset-0 flex items-center justify-center transition-transform duration-300 ease-in-out",
          isDark ? "translate-y-0" : "-translate-y-full"
        )}
      >
        <Moon className={clsx(currentSize.icon, "text-slate-300")} />
      </div>
      <div 
        className={clsx(
          "absolute inset-0 flex items-center justify-center transition-transform duration-300 ease-in-out",
          isDark ? "translate-y-full" : "translate-y-0"
        )}
      >
        <Sun className={clsx(currentSize.icon, "text-amber-500")} />
      </div>
    </button>
  );
}

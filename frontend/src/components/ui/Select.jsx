import React from 'react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ChevronDown } from 'lucide-react';

export default function Select({
  value,
  onChange,
  children,
  error,
  disabled = false,
  className,
  size = 'md',
  ...props
}) {
  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-3.5 py-2.5 text-sm',
    lg: 'px-4 py-3 text-sm'
  };

  return (
    <div className="relative">
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={twMerge(
          clsx(
            'w-full appearance-none bg-[var(--bg-surface-2,#191c24)] border rounded-lg text-[var(--text-primary)] pr-10 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 transition-all duration-150 cursor-pointer',
            error ? 'border-severity-critical' : 'border-[var(--border-color)]',
            disabled && 'opacity-50 cursor-not-allowed',
            sizes[size],
            className
          )
        )}
        {...props}
      >
        {children}
      </select>
      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
        <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />
      </div>
      {error && (
        <p className="text-severity-critical text-xs mt-1">{error}</p>
      )}
    </div>
  );
}

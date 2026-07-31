import React from 'react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

export default function Input({
  type = 'text',
  placeholder,
  value,
  onChange,
  icon: Icon,
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
      {Icon && (
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
          <Icon className="w-4 h-4 text-[var(--text-muted)]" />
        </div>
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={twMerge(
          clsx(
            'w-full bg-[var(--bg-surface-2,#191c24)] border rounded-lg text-[var(--text-primary)] placeholder-slate-600 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 transition-all duration-150',
            error ? 'border-severity-critical' : 'border-[var(--border-color)]',
            Icon ? 'pl-10' : '',
            disabled && 'opacity-50 cursor-not-allowed',
            sizes[size],
            className
          )
        )}
        {...props}
      />
      {error && (
        <p className="text-severity-critical text-xs mt-1">{error}</p>
      )}
    </div>
  );
}

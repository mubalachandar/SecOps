import React from 'react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';
import Spinner from './Spinner';

export default function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  onClick,
  children,
  className,
  type = 'button'
}) {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-150 focus-ring active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none';

  const variants = {
    primary: 'bg-accent hover:bg-accent-hover text-white shadow-[0_1px_2px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)] hover:shadow-[0_1px_3px_rgba(6,182,212,0.3),inset_0_1px_0_rgba(255,255,255,0.12)]',
    secondary: 'bg-[var(--bg-surface-2,#191c24)] border border-[var(--border-color)] hover:border-[var(--border-strong)] text-[var(--text-secondary)]',
    danger: 'bg-severity-critical hover:bg-[#d9303f] text-white shadow-[0_1px_2px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)]',
    ghost: 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-surface-2,#191c24)]',
    outline: 'border border-[var(--border-strong,#2a2e38)] bg-transparent hover:border-accent/50 hover:bg-accent-muted text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs rounded-lg gap-1.5',
    md: 'px-4 py-2 text-sm rounded-lg gap-2',
    lg: 'px-6 py-2.5 text-sm rounded-lg gap-2'
  };

  return (
    <button
      type={type}
      className={twMerge(clsx(baseStyles, variants[variant], sizes[size], className))}
      onClick={onClick}
      disabled={disabled || isLoading}
    >
      {isLoading && <Spinner size="sm" className="mr-0" />}
      {children}
    </button>
  );
}

import React from 'react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

const variantMap = {
  critical: {
    bg: 'bg-severity-critical-muted',
    text: 'text-severity-critical',
    border: 'border-severity-critical/20',
    dot: 'bg-severity-critical'
  },
  high: {
    bg: 'bg-severity-high-muted',
    text: 'text-severity-high',
    border: 'border-severity-high/20',
    dot: 'bg-severity-high'
  },
  medium: {
    bg: 'bg-severity-medium-muted',
    text: 'text-severity-medium',
    border: 'border-severity-medium/20',
    dot: 'bg-severity-medium'
  },
  low: {
    bg: 'bg-severity-low-muted',
    text: 'text-severity-low',
    border: 'border-severity-low/20',
    dot: 'bg-severity-low'
  },
  info: {
    bg: 'bg-severity-info-muted',
    text: 'text-severity-info',
    border: 'border-severity-info/20',
    dot: 'bg-severity-info'
  },
  open: {
    bg: 'bg-severity-critical-muted',
    text: 'text-severity-critical',
    border: 'border-severity-critical/20',
    dot: 'bg-severity-critical'
  },
  investigating: {
    bg: 'bg-severity-high-muted',
    text: 'text-severity-high',
    border: 'border-severity-high/20',
    dot: 'bg-severity-high'
  },
  resolved: {
    bg: 'bg-success/[0.12]',
    text: 'text-success',
    border: 'border-success/20',
    dot: 'bg-success'
  },
  false_positive: {
    bg: 'bg-severity-info-muted',
    text: 'text-severity-info',
    border: 'border-severity-info/20',
    dot: 'bg-severity-info'
  }
};

export default function Badge({
  variant = 'info',
  size = 'md',
  children,
  className
}) {
  const v = variantMap[variant] || variantMap.info;

  const sizes = {
    sm: 'px-1.5 py-0.5 text-[10px] rounded',
    md: 'px-2.5 py-1 text-xs font-medium rounded-md'
  };

  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center border',
          v.bg,
          v.text,
          v.border,
          sizes[size],
          className
        )
      )}
    >
      <span className={clsx('w-1.5 h-1.5 rounded-full mr-1.5 shrink-0', v.dot)} />
      {children}
    </span>
  );
}

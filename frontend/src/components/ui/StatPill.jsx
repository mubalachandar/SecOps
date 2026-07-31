import React from 'react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

const colorMap = {
  slate: 'text-[var(--text-secondary)]',
  accent: 'text-accent',
  critical: 'text-severity-critical',
  high: 'text-severity-high',
  success: 'text-success'
};

export default function StatPill({ label, value, color = 'slate', className }) {
  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center gap-1.5 bg-[var(--bg-surface-2,#191c24)] border border-[var(--border-color)] rounded-full px-2.5 py-1 text-xs',
          className
        )
      )}
    >
      <span className={clsx('font-semibold tabular-nums', colorMap[color] || colorMap.slate)}>
        {value}
      </span>
      <span className="text-[var(--text-muted)]">{label}</span>
    </span>
  );
}

import React from 'react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

export default function SectionHeader({
  title,
  subtitle,
  action,
  icon: Icon,
  level = 'section',
  className
}) {
  const titleClasses = {
    page: 'text-2xl font-semibold tracking-tight text-[var(--text-primary)]',
    section: 'text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)]'
  };

  return (
    <div className={twMerge(clsx('flex items-center justify-between', level === 'section' ? 'mb-4' : 'mb-6', className))}>
      <div className="flex items-center gap-2.5">
        {Icon && (
          <div className="w-8 h-8 rounded-lg bg-[var(--bg-surface-2,#191c24)] border border-[var(--border-color)] flex items-center justify-center">
            <Icon className="w-4 h-4 text-[var(--text-muted)]" />
          </div>
        )}
        <div>
          <h2 className={titleClasses[level] || titleClasses.section}>{title}</h2>
          {subtitle && (
            <p className="text-xs font-medium text-[var(--text-muted)] mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

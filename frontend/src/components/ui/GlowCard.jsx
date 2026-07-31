import React from 'react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

const glowStyles = {
  accent: 'elevation-glow-accent',
  critical: 'elevation-glow-critical',
  success: 'shadow-[0_0_0_1px_rgba(47,191,113,0.15),0_0_24px_rgba(47,191,113,0.08)]',
  none: 'elevation-1'
};

const glowGradients = {
  accent: 'before:bg-gradient-to-br before:from-accent/[0.07] before:to-transparent',
  critical: 'before:bg-gradient-to-br before:from-severity-critical/[0.07] before:to-transparent',
  success: 'before:bg-gradient-to-br before:from-success/[0.07] before:to-transparent',
  none: ''
};

export default function GlowCard({
  glow = 'accent',
  title,
  subtitle,
  children,
  className,
  bodyClassName,
  headerAction,
  padding = 'md'
}) {
  const paddings = {
    none: 'p-0',
    sm: 'p-3',
    md: 'p-4 md:p-5',
    lg: 'p-6 md:p-8'
  };

  return (
    <div
      className={twMerge(
        clsx(
          'relative overflow-hidden bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl',
          glowStyles[glow],
          paddings[padding],
          className
        )
      )}
    >
      {glow !== 'none' && (
        <div
          className={clsx(
            'absolute inset-0 pointer-events-none',
            glowGradients[glow]
          )}
          aria-hidden="true"
        />
      )}
      <div className={twMerge('relative z-10', className?.includes('flex-col') && 'flex-1 flex flex-col')}>
        {title && (
          <div className="border-b border-[var(--border-color)] pb-3.5 mb-4 flex justify-between items-start shrink-0">
            <div>
              <h3 className="text-[var(--text-primary)] font-semibold text-sm">{title}</h3>
              {subtitle && (
                <p className="text-[var(--text-muted)] text-xs font-medium mt-0.5">{subtitle}</p>
              )}
            </div>
            {headerAction && <div>{headerAction}</div>}
          </div>
        )}
        <div className={twMerge(className?.includes('flex-col') && 'flex-1 flex flex-col', bodyClassName)}>{children}</div>
      </div>
    </div>
  );
}

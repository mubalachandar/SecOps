import React from 'react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

export default function Card({
  title,
  subtitle,
  children,
  className,
  bodyClassName,
  headerAction,
  padding = 'md',
  hover = false
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
          'bg-white dark:bg-[#13151b] border-gray-200 dark:border-[#1f2229] border rounded-2xl elevation-1',
          hover && 'hover:border-gray-300 dark:hover:border-[#2a2e38] hover:elevation-2 transition-all duration-200',
          paddings[padding],
          className
        )
      )}
    >
      {title && (
        <div className={clsx(
          "border-b border-gray-200 dark:border-[#1f2229] pb-3.5 flex justify-between items-start",
          padding === 'none' ? "pt-4 md:pt-5 px-4 md:px-5 mb-0" : "mb-4"
        )}>
          <div>
            <h3 className="text-gray-900 dark:text-slate-100 font-semibold text-sm">{title}</h3>
            {subtitle && (
              <p className="text-gray-500 dark:text-slate-500 text-xs font-medium mt-0.5">{subtitle}</p>
            )}
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      <div className={twMerge(className?.includes('flex-col') && 'flex-1 flex flex-col', bodyClassName)}>{children}</div>
    </div>
  );
}

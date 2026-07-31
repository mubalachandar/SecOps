import React from 'react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

export default function Spinner({
  size = 'md',
  color = 'blue',
  className
}) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  const colors = {
    blue: 'border-accent/30 border-t-accent',
    white: 'border-white/20 border-t-white',
    slate: 'border-slate-700 border-t-slate-400'
  };

  return (
    <div className={twMerge('flex justify-center items-center', className)}>
      <div
        className={clsx(
          'rounded-full animate-spin border-2',
          sizes[size],
          colors[color]
        )}
      />
    </div>
  );
}

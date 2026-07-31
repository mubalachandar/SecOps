import React, { useState } from 'react';
import clsx from 'clsx';

const positionClasses = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2'
};

const caretClasses = {
  top: 'top-full left-1/2 -translate-x-1/2 border-t-[var(--bg-canvas-raised,#0e1015)] border-x-transparent border-b-transparent',
  bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-[var(--bg-canvas-raised,#0e1015)] border-x-transparent border-t-transparent',
  left: 'left-full top-1/2 -translate-y-1/2 border-l-[var(--bg-canvas-raised,#0e1015)] border-y-transparent border-r-transparent',
  right: 'right-full top-1/2 -translate-y-1/2 border-r-[var(--bg-canvas-raised,#0e1015)] border-y-transparent border-l-transparent'
};

export default function Tooltip({ content, children, position = 'top' }) {
  const [visible, setVisible] = useState(false);

  if (!content) return children;

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div
          className={clsx(
            'absolute z-50 whitespace-nowrap animate-scaleIn',
            positionClasses[position]
          )}
        >
          <div className="bg-[var(--bg-canvas-raised,#0e1015)] border border-[var(--border-strong,#2a2e38)] text-xs text-slate-200 px-2.5 py-1.5 rounded-lg shadow-lg">
            {content}
          </div>
          <div
            className={clsx(
              'absolute w-0 h-0 border-4',
              caretClasses[position]
            )}
          />
        </div>
      )}
    </div>
  );
}

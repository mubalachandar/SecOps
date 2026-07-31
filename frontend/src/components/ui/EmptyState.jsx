import React from 'react';

export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-fadeIn">
      {Icon && (
        <div className="w-14 h-14 rounded-full bg-[var(--bg-surface-2,#191c24)] border border-[var(--border-color)] flex items-center justify-center mb-5">
          <Icon className="w-6 h-6 text-[var(--text-muted)]" />
        </div>
      )}
      <h3 className="text-[var(--text-primary)] text-sm font-semibold">{title}</h3>
      {description && (
        <p className="text-[var(--text-muted)] text-xs mt-2 max-w-sm leading-relaxed">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

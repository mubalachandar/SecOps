import React, { useState } from 'react';
import { Send } from 'lucide-react';
import Spinner from '../ui/Spinner';

export default function ChatInput({ onSend, isLoading, disabled }) {
  const [value, setValue] = useState('');

  const handleInput = (e) => {
    setValue(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
  };

  const handleSend = () => {
    if (!value.trim() || isLoading || isOverLimit) return;
    onSend(value.trim());
    setValue('');
    const ta = document.getElementById('chat-input-area');
    if (ta) ta.style.height = 'auto';
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const isOverLimit = value.length > 2000;
  const isNearLimit = value.length > 1800;

  return (
    <div className="flex items-end gap-3">
      <div className="flex-1">
        <textarea
          id="chat-input-area"
          rows={1}
          value={value}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Ask about threats, alerts, or MITRE ATT&CK... (Shift+Enter for new line)"
          className="w-full bg-[#13151b] border border-[#1f2229] rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 resize-none focus:outline-none focus:border-[#06b6d4]/50 focus:ring-2 focus:ring-[#06b6d4]/10 transition-all overflow-y-auto"
          style={{ maxHeight: '160px' }}
          disabled={disabled}
        />
        <div className="flex justify-end mt-1">
          <span className={`text-[10px] ${
            isOverLimit ? 'text-[#f0384a]' : isNearLimit ? 'text-[#f5942e]' : 'text-slate-700'
          }`}>{value.length}/2000</span>
        </div>
      </div>
      <button
        onClick={handleSend}
        disabled={isLoading || disabled || !value.trim() || isOverLimit}
        className="w-11 h-11 shrink-0 bg-[#06b6d4] hover:bg-[#6b92ff] disabled:opacity-30 disabled:cursor-not-allowed rounded-xl flex items-center justify-center transition-all active:scale-95 mb-6"
      >
        {isLoading ? (
          <Spinner size="sm" color="white" />
        ) : (
          <Send className="w-5 h-5 text-white" />
        )}
      </button>
    </div>
  );
}

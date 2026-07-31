import React from 'react';
import { Zap, MessageSquare } from 'lucide-react';

export default function SuggestedPrompts({ prompts = [], onSelect, isVisible }) {
  if (!isVisible) return null;

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] px-4">
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#06b6d4] to-purple-600 flex items-center justify-center">
        <Zap className="w-7 h-7 text-white" />
      </div>
      <h2 className="text-xl font-semibold text-slate-100 mt-5">SecOps AI Assistant</h2>
      <p className="text-sm text-slate-500 mt-2 text-center max-w-md">
        Your AI-powered cybersecurity analyst powered by Gemini Flash. Ask about threats, alerts, and MITRE ATT&CK techniques.
      </p>

      {prompts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-8 w-full max-w-2xl">
          {prompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => onSelect(prompt)}
              className="bg-[#13151b] hover:bg-[#191c24] border border-[#1f2229] hover:border-[#2a2e38] rounded-xl p-4 text-left transition-all group"
            >
              <MessageSquare className="w-4 h-4 text-slate-600 group-hover:text-[#06b6d4] transition-colors" />
              <p className="text-sm text-slate-400 group-hover:text-slate-300 mt-2 leading-relaxed transition-colors">{prompt}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

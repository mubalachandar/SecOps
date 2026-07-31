import React from 'react';
import { Zap } from 'lucide-react';

const inlineFormat = (text) => {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/);
  return parts.map((part, i) => {
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i} className="bg-[#05060a] text-[#06b6d4] font-mono text-[11px] px-1.5 py-0.5 rounded">{part.slice(1,-1)}</code>;
    }
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="text-slate-100 font-semibold">{part.slice(2,-2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
};

const renderMarkdown = (text) => {
  if (!text) return null;
  const lines = text.split('\n');
  const elements = [];
  lines.forEach((line, i) => {
    if (line.startsWith('# ')) {
      elements.push(<div key={i} className="text-slate-100 font-semibold text-base mt-3 mb-1 block">{line.slice(2)}</div>);
    } else if (line.startsWith('## ')) {
      elements.push(<div key={i} className="text-slate-200 font-medium text-sm mt-2 mb-1 block">{line.slice(3)}</div>);
    } else if (line.startsWith('- ') || line.startsWith('• ')) {
      elements.push(
        <div key={i} className="flex items-start gap-2 mb-1">
          <div className="w-1 h-1 rounded-full bg-slate-600 mt-2 shrink-0" />
          <span className="text-slate-300 text-sm leading-relaxed">{inlineFormat(line.slice(2))}</span>
        </div>
      );
    } else if (/^\d+\.\s/.test(line)) {
      const num = line.match(/^(\d+)\./)[1];
      elements.push(
        <div key={i} className="flex items-start gap-2 mb-1">
          <div className="w-4 h-4 rounded-full bg-[#06b6d4]/20 text-[#06b6d4] text-[9px] font-bold flex items-center justify-center shrink-0 mt-0.5">{num}</div>
          <span className="text-slate-300 text-sm leading-relaxed">{inlineFormat(line.replace(/^\d+\.\s/, ''))}</span>
        </div>
      );
    } else if (line.trim() === '') {
      elements.push(<div key={i} className="h-2" />);
    } else {
      elements.push(<p key={i} className="text-slate-300 text-sm leading-relaxed">{inlineFormat(line)}</p>);
    }
  });
  return <div className="space-y-0.5">{elements}</div>;
};

export default function ChatMessage({ message }) {
  const { role, content, isTyping, isError, tokensUsed, timestamp } = message;
  const timeStr = timestamp ? new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

  if (role === 'user') {
    return (
      <div className="flex justify-end mb-4">
        <div>
          <div className="bg-[#06b6d4] text-white rounded-2xl rounded-tr-sm px-4 py-3 max-w-lg">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
          </div>
          {timeStr && <p className="text-[10px] text-slate-700 text-right mt-1">{timeStr}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 mb-4">
      <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#06b6d4] to-purple-600 flex items-center justify-center shrink-0 mt-0.5">
        <Zap className="w-3.5 h-3.5 text-white" />
      </div>
      <div className="flex-1 max-w-2xl">
        {isTyping ? (
          <div className="bg-[#13151b] border border-[#1f2229] rounded-2xl rounded-tl-sm px-4 py-3 inline-block">
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-slate-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-slate-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-slate-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        ) : isError ? (
          <div className="bg-[#f0384a]/8 border border-[#f0384a]/20 rounded-2xl rounded-tl-sm px-4 py-3">
            <p className="text-[#f0384a] text-sm">{content}</p>
          </div>
        ) : (
          <div className="bg-[#13151b] border border-[#1f2229] rounded-2xl rounded-tl-sm px-4 py-3">
            {renderMarkdown(content)}
          </div>
        )}
        {!isTyping && (
          <div className="flex items-center gap-3 mt-1.5 ml-1">
            {timeStr && <span className="text-[10px] text-slate-700">{timeStr}</span>}
            {tokensUsed > 0 && <span className="text-[10px] text-slate-700">~{tokensUsed} tokens</span>}
          </div>
        )}
      </div>
    </div>
  );
}

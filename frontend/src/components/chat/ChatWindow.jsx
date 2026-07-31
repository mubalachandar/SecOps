import React from 'react';
import { Zap, Trash2 } from 'lucide-react';
import { useChat } from '../../hooks/useChat';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import SuggestedPrompts from './SuggestedPrompts';
import Button from '../ui/Button';

export default function ChatWindow() {
  const { messages, isTyping, sendMessage, clearChat, suggestedPrompts, messagesEndRef } = useChat();

  return (
    <div className="flex flex-col h-full bg-[#08090c]">
      {/* Header */}
      <div className="h-14 border-b border-[#1f2229] px-6 flex items-center justify-between bg-[#0e1015] shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#06b6d4] to-purple-600 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-semibold text-slate-100">SecOps AI</span>
          <span className="bg-[#191c24] border border-[#2a2e38] text-[11px] text-slate-500 px-2 py-0.5 rounded-full">Gemini Flash</span>
        </div>
        {messages.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clearChat}>
            <Trash2 className="w-3.5 h-3.5" />
            Clear
          </Button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {messages.length === 0 ? (
          <SuggestedPrompts
            prompts={suggestedPrompts || []}
            onSelect={sendMessage}
            isVisible={true}
          />
        ) : (
          <div>
            {messages.map(msg => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-[#1f2229] bg-[#0e1015] px-6 py-4">
        <ChatInput onSend={sendMessage} isLoading={isTyping} disabled={false} />
      </div>
    </div>
  );
}

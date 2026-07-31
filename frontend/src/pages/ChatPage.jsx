import React from 'react';
import ChatWindow from '../components/chat/ChatWindow';

export default function ChatPage() {
  return (
    <div className="h-[calc(100vh-3.5rem)] rounded-2xl overflow-hidden border border-[#1f2229]">
      <ChatWindow />
    </div>
  );
}

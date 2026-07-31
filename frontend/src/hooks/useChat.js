import { useState, useCallback, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { chatApi } from '../services/api';
import toast from 'react-hot-toast';

const uuidv4 = () => {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Date.now().toString(36) + Math.random().toString(36).substring(2);
};

export const useChat = () => {
  const [messages, setMessages] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const sendMessage = useCallback(async (userMessage) => {
    if (!userMessage.trim()) return;

    const sid = sessionId || 'session-' + Date.now();
    if (!sessionId) {
      setSessionId(sid);
    }

    const newUserMessage = {
      id: uuidv4(),
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, newUserMessage]);
    setIsTyping(true);

    const typingIndicator = { id: 'typing', role: 'assistant', isTyping: true };
    setMessages((prev) => [...prev, typingIndicator]);

    try {
      const response = await chatApi.sendMessage(userMessage, sid);
      setMessages((prev) => {
        const filtered = prev.filter((m) => m.id !== 'typing');
        return [
          ...filtered,
          {
            id: uuidv4(),
            role: 'assistant',
            content: response.message,
            tokensUsed: response.tokensUsed,
            timestamp: response.timestamp,
          },
        ];
      });
    } catch (error) {
      setMessages((prev) => {
        const filtered = prev.filter((m) => m.id !== 'typing');
        return [
          ...filtered,
          {
            id: uuidv4(),
            role: 'assistant',
            content: 'Sorry I encountered an error. Please try again.',
            isError: true,
            timestamp: new Date().toISOString(),
          },
        ];
      });
      toast.error('Failed to send message');
    } finally {
      setIsTyping(false);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [sessionId]);

  const clearChat = useCallback(async () => {
    if (sessionId) {
      try {
        await chatApi.clearSession(sessionId);
      } catch (e) {
        console.error(e);
      }
    }
    setMessages([]);
    setSessionId(null);
  }, [sessionId]);

  const { data: suggestedPrompts } = useQuery({
    queryKey: ['chat', 'suggested-prompts'],
    queryFn: () => chatApi.getSuggestedPrompts('general'),
    staleTime: Infinity,
  });

  return {
    messages,
    sessionId,
    isTyping,
    sendMessage,
    clearChat,
    suggestedPrompts,
    messagesEndRef,
  };
};

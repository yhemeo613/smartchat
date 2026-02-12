'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { MessageBubble } from '@/components/chat/message-bubble';
import { ChatInput } from '@/components/chat/chat-input';
import { TypingIndicator } from '@/components/chat/typing-indicator';
import { SourceCard } from '@/components/chat/source-card';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: { title: string; snippet: string; score?: number }[];
}

interface ChatViewProps {
  botId: string;
  botName: string;
  welcomeMessage: string;
  themeColor: string;
  avatarUrl?: string | null;
}

function getVisitorId(): string {
  if (typeof window === 'undefined') return '';
  const key = 'smartchat-visitor-id';
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

export function ChatView({
  botId,
  botName,
  welcomeMessage,
  themeColor,
}: ChatViewProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  const handleSend = async (content: string) => {
    const visitorId = getVisitorId();
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    const assistantId = crypto.randomUUID();
    let fullContent = '';

    try {
      const res = await fetch(`/api/chat/${botId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          visitorId: visitorId,
          conversationId: conversationId,
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const contentType = res.headers.get('content-type') || '';

      if (contentType.includes('text/event-stream')) {
        // SSE streaming response
        const reader = res.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) throw new Error('No response body');

        setIsTyping(false);
        setMessages((prev) => [
          ...prev,
          { id: assistantId, role: 'assistant', content: '' },
        ]);

        let buffer = '';
        let sources: ChatMessage['sources'] = undefined;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const data = line.slice(6);

            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);

              if (parsed.conversationId && !conversationId) {
                setConversationId(parsed.conversationId);
              }

              if (parsed.text) {
                fullContent += parsed.text;
                const snapshot = fullContent;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId ? { ...m, content: snapshot } : m
                  )
                );
              }

              if (parsed.sources) {
                sources = parsed.sources.map((s: { content: string; metadata: Record<string, string>; similarity: number }) => ({
                  title: s.metadata?.source || 'Source',
                  snippet: s.content,
                  score: s.similarity,
                }));
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId ? { ...m, sources } : m
                  )
                );
              }
            } catch {
              // skip non-JSON lines
            }
          }
        }
      } else {
        // JSON response fallback
        const data = await res.json();
        setIsTyping(false);

        if (data.conversationId && !conversationId) {
          setConversationId(data.conversationId);
        }

        setMessages((prev) => [
          ...prev,
          {
            id: assistantId,
            role: 'assistant',
            content: data.message || data.content || '',
            sources: data.sources,
          },
        ]);
      }
    } catch {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: assistantId,
          role: 'assistant',
          content: 'Sorry, something went wrong. Please try again.',
        },
      ]);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 border-b text-white shrink-0"
        style={{ backgroundColor: themeColor }}
      >
        <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">
          {botName.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="text-sm font-semibold leading-tight">{botName}</h1>
          <p className="text-xs opacity-80">Online</p>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto py-4 space-y-1">
        {/* Welcome message */}
        <MessageBubble
          role="assistant"
          content={welcomeMessage}
          themeColor={themeColor}
        />

        {messages.map((msg) => (
          <div key={msg.id}>
            <MessageBubble
              role={msg.role}
              content={msg.content}
              themeColor={themeColor}
            />
            {msg.sources && msg.sources.length > 0 && (
              <div className="px-4 pl-15 pb-2">
                <p className="text-xs text-muted-foreground mb-1.5 font-medium">
                  Sources
                </p>
                <div className="grid gap-1.5 max-w-[80%]">
                  {msg.sources.map((src, i) => (
                    <SourceCard
                      key={i}
                      title={src.title}
                      snippet={src.snippet}
                      score={src.score}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        {isTyping && <TypingIndicator />}
      </div>

      {/* Input */}
      <ChatInput onSend={handleSend} disabled={isTyping} />
    </div>
  );
}

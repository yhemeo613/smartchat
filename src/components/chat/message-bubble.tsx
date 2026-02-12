'use client';

import { cn } from '@/lib/utils';

interface MessageBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  themeColor?: string;
}

export function MessageBubble({ role, content, themeColor = '#3B82F6' }: MessageBubbleProps) {
  const isUser = role === 'user';

  return (
    <div className={cn('flex items-start gap-3 px-4 py-2', isUser && 'flex-row-reverse')}>
      {!isUser && (
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
          style={{ background: `linear-gradient(135deg, ${themeColor}, #8B5CF6)` }}
        >
          AI
        </div>
      )}
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap',
          isUser
            ? 'rounded-tr-sm text-white'
            : 'rounded-tl-sm bg-muted text-foreground'
        )}
        style={isUser ? { backgroundColor: themeColor } : undefined}
      >
        {content}
      </div>
    </div>
  );
}

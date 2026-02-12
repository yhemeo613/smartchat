'use client';

import { Badge } from '@/components/ui/badge';
import { FileText } from 'lucide-react';

interface SourceCardProps {
  title: string;
  snippet: string;
  score?: number;
}

export function SourceCard({ title, snippet, score }: SourceCardProps) {
  return (
    <div className="flex items-start gap-2 p-2.5 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer">
      <FileText className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium truncate">{title}</span>
          {score != null && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {Math.round(score * 100)}%
            </Badge>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">{snippet}</p>
      </div>
    </div>
  );
}

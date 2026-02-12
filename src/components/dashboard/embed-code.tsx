'use client';

import { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Check, Copy } from 'lucide-react';

interface EmbedCodeProps {
  botId: string;
}

export function EmbedCode({ botId }: EmbedCodeProps) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com';

  const embedScript = `<!-- SmartChat Widget -->
<script src="${origin}/widget.js" data-bot-id="${botId}" async></script>`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(embedScript);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert('Failed to copy to clipboard. Please copy the code manually.');
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        {t.dashboard.embedInstructions}
      </p>
      <div className="relative">
        <pre className="rounded-lg bg-slate-950 p-4 overflow-x-auto">
          <code className="text-sm text-slate-300 font-mono leading-relaxed">
            {embedScript.split('\n').map((line, i) => (
              <span key={i} className="block">
                {line.split(/(<[^>]+>|'[^']*'|"[^"]*")/g).map((part, j) => {
                  if (part.startsWith('<') || part.startsWith('</')) {
                    return (
                      <span key={j} className="text-sky-400">
                        {part}
                      </span>
                    );
                  }
                  if (part.startsWith("'") || part.startsWith('"')) {
                    return (
                      <span key={j} className="text-emerald-400">
                        {part}
                      </span>
                    );
                  }
                  if (
                    /\b(var|function|document|true|false)\b/.test(part)
                  ) {
                    return (
                      <span key={j}>
                        {part.split(/\b(var|function|document|true|false)\b/g).map(
                          (segment, k) => {
                            if (
                              ['var', 'function', 'true', 'false'].includes(
                                segment
                              )
                            ) {
                              return (
                                <span key={k} className="text-purple-400">
                                  {segment}
                                </span>
                              );
                            }
                            if (segment === 'document') {
                              return (
                                <span key={k} className="text-amber-300">
                                  {segment}
                                </span>
                              );
                            }
                            return <span key={k}>{segment}</span>;
                          }
                        )}
                      </span>
                    );
                  }
                  return <span key={j}>{part}</span>;
                })}
              </span>
            ))}
          </code>
        </pre>
        <Button
          variant="secondary"
          size="sm"
          className="absolute top-3 right-3"
          onClick={handleCopy}
        >
          {copied ? (
            <>
              <Check className="size-3.5" />
              {t.dashboard.copied}
            </>
          ) : (
            <>
              <Copy className="size-3.5" />
              {t.dashboard.copyCode}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

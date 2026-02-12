'use client';

import { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Check, Copy } from 'lucide-react';

interface DocsCodeBlockProps {
  code: string;
  language?: string;
}

export function DocsCodeBlock({ code, language }: DocsCodeBlockProps) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // silently fail
    }
  };

  return (
    <div className="relative">
      <pre className="rounded-lg bg-slate-950 p-4 overflow-x-auto">
        <code className={`text-sm text-slate-300 font-mono leading-relaxed${language ? ` language-${language}` : ''}`}>
          {code}
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
  );
}

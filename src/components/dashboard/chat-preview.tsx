'use client';

import { useCallback, useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { RefreshCw, ExternalLink } from 'lucide-react';

interface ChatPreviewProps {
  botId: string;
  botName: string;
  themeColor: string;
}

export function ChatPreview({ botId, botName, themeColor }: ChatPreviewProps) {
  const { t } = useI18n();
  const [iframeKey, setIframeKey] = useState(0);

  const chatUrl = `/chat/${botId}?preview=true`;

  const handleRefresh = useCallback(() => {
    setIframeKey((k) => k + 1);
  }, []);

  const handleOpenNewWindow = useCallback(() => {
    window.open(chatUrl, '_blank', 'noopener');
  }, [chatUrl]);

  return (
    <div className="mt-6 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">{t.dashboard.chatPreview}</h3>
          <p className="text-xs text-muted-foreground">
            {t.dashboard.chatPreviewDesc}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="size-3.5" />
            {t.dashboard.refreshChat}
          </Button>
          <Button variant="outline" size="sm" onClick={handleOpenNewWindow}>
            <ExternalLink className="size-3.5" />
            {t.dashboard.openInNewWindow}
          </Button>
        </div>
      </div>
      <div
        className="overflow-hidden rounded-lg border shadow-sm"
        style={{ borderColor: themeColor + '33' }}
      >
        <iframe
          key={iframeKey}
          src={chatUrl}
          title={`${botName} preview`}
          className="w-full border-0"
          style={{ height: 500 }}
        />
      </div>
    </div>
  );
}

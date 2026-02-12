'use client';

import { useState, useRef, useCallback } from 'react';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Document } from '@/types';
import {
  Upload,
  FileText,
  Trash2,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DocumentUploadProps {
  documents: Document[];
  onUpload?: (files: File[]) => void;
  onDelete?: (id: string) => void;
}

export function DocumentUpload({
  documents,
  onUpload,
  onDelete,
}: DocumentUploadProps) {
  const { t } = useI18n();
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        onUpload?.(files);
      }
    },
    [onUpload]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length > 0) {
        onUpload?.(files);
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [onUpload]
  );

  const statusIcon = (status: Document['status']) => {
    switch (status) {
      case 'processing':
        return <Loader2 className="size-3.5 animate-spin text-amber-500" />;
      case 'ready':
        return <CheckCircle2 className="size-3.5 text-emerald-500" />;
      case 'error':
        return <AlertCircle className="size-3.5 text-red-500" />;
    }
  };

  const statusLabel = (status: Document['status']) => {
    switch (status) {
      case 'processing':
        return t.dashboard.processing;
      case 'ready':
        return t.dashboard.ready;
      case 'error':
        return t.dashboard.error;
    }
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          'flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 cursor-pointer transition-colors',
          isDragging
            ? 'border-indigo-500 bg-indigo-50/50'
            : 'border-muted-foreground/25 hover:border-muted-foreground/50'
        )}
        role="button"
        tabIndex={0}
        aria-label={t.dashboard.uploadDocuments}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
      >
        <div className="flex size-10 items-center justify-center rounded-full bg-muted">
          <Upload className="size-4 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium">{t.dashboard.dragDrop}</p>
        <p className="text-xs text-muted-foreground">
          {t.dashboard.supportedFormats}
        </p>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          multiple
          accept=".pdf,.txt,.docx,.md"
          onChange={handleFileSelect}
        />
      </div>

      {documents.length > 0 && (
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {documents.map((doc) => (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-3 rounded-lg border px-3 py-2.5"
              >
                <FileText className="size-4 shrink-0 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{doc.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {doc.token_count.toLocaleString()} {t.dashboard.tokens}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge
                    variant="secondary"
                    className={cn(
                      'text-[10px] gap-1',
                      doc.status === 'processing' &&
                        'bg-amber-50 text-amber-700',
                      doc.status === 'ready' &&
                        'bg-emerald-50 text-emerald-700',
                      doc.status === 'error' && 'bg-red-50 text-red-700'
                    )}
                  >
                    {statusIcon(doc.status)}
                    {statusLabel(doc.status)}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => onDelete?.(doc.id)}
                    aria-label={`Delete ${doc.name}`}
                  >
                    <Trash2 className="size-3 text-muted-foreground" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

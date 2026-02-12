'use client';

import { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { useBots } from '@/hooks/use-bots';
import { BotCard } from '@/components/dashboard/bot-card';
import { CreateBotDialog } from '@/components/dashboard/create-bot-dialog';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, Bot, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function BotsPage() {
  const { t } = useI18n();
  const { bots, loading, createBot, deleteBot } = useBots();
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    setDeleteTarget(id);
  };

  const confirmDelete = async () => {
    if (deleteTarget) {
      await deleteBot(deleteTarget);
      setDeleteTarget(null);
    }
  };

  const handleCopyEmbed = async (id: string) => {
    const script = `<script src="${window.location.origin}/widget.js" data-bot-id="${id}" async></script>`;
    await navigator.clipboard.writeText(script);
  };

  const handleCreate = async (data: {
    name: string;
    description: string;
    welcome_message: string;
    system_prompt: string;
    theme_color: string;
    model: string;
  }) => {
    await createBot(data);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold tracking-tight">
          {t.dashboard.bots}
        </h2>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="size-3.5" />
          {t.dashboard.createBot}
        </Button>
      </div>

      {bots.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center"
        >
          <div className="flex size-12 items-center justify-center rounded-full bg-muted mb-4">
            <Bot className="size-6 text-muted-foreground" />
          </div>
          <h3 className="text-base font-semibold">
            {t.dashboard.createFirstBot}
          </h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            {t.dashboard.noBotsDescription}
          </p>
          <Button className="mt-4" onClick={() => setCreateOpen(true)}>
            <Plus className="size-3.5" />
            {t.dashboard.createBot}
          </Button>
        </motion.div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {bots.map((bot) => (
            <BotCard
              key={bot.id}
              bot={bot}
              onDelete={handleDelete}
              onCopyEmbed={handleCopyEmbed}
            />
          ))}
        </div>
      )}

      <CreateBotDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreate={handleCreate}
      />

      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t.dashboard.confirmDelete}</DialogTitle>
            <DialogDescription>
              {t.dashboard.deleteDescription}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              {t.dashboard.botForm.cancel}
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              {t.dashboard.delete}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

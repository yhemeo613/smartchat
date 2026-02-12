'use client';

import Link from 'next/link';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import type { Bot } from '@/types';
import {
  MoreVertical,
  Pencil,
  Trash2,
  Code2,
  MessageSquare,
  Eye,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface BotCardProps {
  bot: Bot & { messageCount?: number };
  onDelete?: (id: string) => void;
  onCopyEmbed?: (id: string) => void;
}

export function BotCard({ bot, onDelete, onCopyEmbed }: BotCardProps) {
  const { t } = useI18n();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="group hover:shadow-md transition-all duration-200 py-0 overflow-hidden">
        <div
          className="h-1.5 w-full"
          style={{ backgroundColor: bot.theme_color || '#6366f1' }}
        />
        <CardContent className="pt-4 pb-3 px-5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <Link
                href={`/dashboard/bots/${bot.id}`}
                className="text-sm font-semibold hover:underline underline-offset-2 truncate block"
              >
                {bot.name}
              </Link>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {bot.description}
              </p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                >
                  <MoreVertical className="size-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/dashboard/bots/${bot.id}`}>
                    <Pencil className="size-3.5" />
                    {t.dashboard.edit}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onCopyEmbed?.(bot.id)}>
                  <Code2 className="size-3.5" />
                  {t.dashboard.copyEmbed}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => onDelete?.(bot.id)}
                >
                  <Trash2 className="size-3.5" />
                  {t.dashboard.delete}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center gap-3 mt-4">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MessageSquare className="size-3" />
              <span>{bot.messageCount ?? 0} {t.dashboard.messagesCount}</span>
            </div>
            <Badge
              variant={bot.is_public ? 'default' : 'secondary'}
              className={cn(
                'text-[10px] px-1.5 py-0',
                bot.is_public
                  ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100'
                  : ''
              )}
            >
              {bot.is_public ? t.dashboard.active : t.dashboard.inactive}
            </Badge>
          </div>
        </CardContent>
        <CardFooter className="border-t px-5 py-2.5 flex items-center justify-between">
          <p className="text-[10px] text-muted-foreground">
            {bot.model} &middot; {new Date(bot.updated_at).toLocaleDateString()}
          </p>
          <Link href="/demo">
            <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2 gap-1 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50">
              <Eye className="size-3" />
              {t.demo.viewDemo}
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </motion.div>
  );
}

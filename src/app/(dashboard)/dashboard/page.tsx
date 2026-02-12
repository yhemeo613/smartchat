'use client';

import { useEffect, useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { useUser } from '@/hooks/use-user';
import { useBots } from '@/hooks/use-bots';
import { createClient } from '@/lib/supabase/client';
import { StatsCard } from '@/components/dashboard/stats-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CreateBotDialog } from '@/components/dashboard/create-bot-dialog';
import {
  Bot,
  MessageSquare,
  MessagesSquare,
  Clock,
  Plus,
  ArrowRight,
  User,
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface DashboardStats {
  totalBots: number;
  totalConversations: number;
  totalMessages: number;
}

interface RecentConversation {
  id: string;
  botName: string;
  visitorId: string;
  title: string;
  messageCount: number;
  updatedAt: string;
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return `${diffMins}m`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d`;
}

export default function DashboardPage() {
  const { t } = useI18n();
  const { user } = useUser();
  const { bots, createBot } = useBots();
  const [createOpen, setCreateOpen] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalBots: 0,
    totalConversations: 0,
    totalMessages: 0,
  });
  const [recentConversations, setRecentConversations] = useState<RecentConversation[]>([]);

  useEffect(() => {
    if (!user) return;

    async function fetchDashboardData() {
      const supabase = createClient();

      // Get bots
      const { data: userBots } = await supabase
        .from('bots')
        .select('id, name')
        .eq('user_id', user!.id);

      const botIds = userBots?.map((b) => b.id) ?? [];
      const botMap = Object.fromEntries((userBots ?? []).map((b) => [b.id, b.name]));
      const totalBots = botIds.length;

      if (totalBots === 0) {
        setStats({ totalBots: 0, totalConversations: 0, totalMessages: 0 });
        setRecentConversations([]);
        return;
      }

      // Get conversations count
      const { count: totalConversations } = await supabase
        .from('conversations')
        .select('id', { count: 'exact', head: true })
        .in('bot_id', botIds);

      // Get recent conversations
      const { data: convs } = await supabase
        .from('conversations')
        .select('*, messages(count)')
        .in('bot_id', botIds)
        .order('updated_at', { ascending: false })
        .limit(5);

      const recent: RecentConversation[] = (convs ?? []).map((conv) => ({
        id: conv.id,
        botName: botMap[conv.bot_id] ?? 'Unknown Bot',
        visitorId: conv.visitor_id,
        title: conv.title || 'Untitled conversation',
        messageCount: (conv.messages as unknown as { count: number }[])?.[0]?.count ?? 0,
        updatedAt: conv.updated_at,
      }));

      // Get total messages
      const { data: allConvIds } = await supabase
        .from('conversations')
        .select('id')
        .in('bot_id', botIds);

      let totalMessages = 0;
      if (allConvIds && allConvIds.length > 0) {
        const { count } = await supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .in('conversation_id', allConvIds.map((c) => c.id));
        totalMessages = count ?? 0;
      }

      setStats({
        totalBots,
        totalConversations: totalConversations ?? 0,
        totalMessages,
      });
      setRecentConversations(recent);
    }

    fetchDashboardData();
  }, [user]);

  const hasBots = stats.totalBots > 0 || bots.length > 0;

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            {t.dashboard.overview}
          </h2>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="size-3.5" />
          {t.dashboard.createBot}
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          icon={<Bot className="size-4 text-indigo-600" />}
          label={t.dashboard.totalBots}
          value={stats.totalBots}
        />
        <StatsCard
          icon={<MessagesSquare className="size-4 text-blue-600" />}
          label={t.dashboard.totalConversations}
          value={stats.totalConversations.toLocaleString()}
        />
        <StatsCard
          icon={<MessageSquare className="size-4 text-emerald-600" />}
          label={t.dashboard.totalMessages}
          value={stats.totalMessages.toLocaleString()}
        />
        <StatsCard
          icon={<Clock className="size-4 text-amber-600" />}
          label={t.dashboard.avgResponseTime}
          value="--"
        />
      </div>

      {/* No bots CTA */}
      {!hasBots && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
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
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Recent conversations */}
      {hasBots && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">
                {t.dashboard.recentConversations}
              </CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/bots">
                  {t.dashboard.viewAll}
                  <ArrowRight className="size-3.5" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="p-0">
            {recentConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <MessageSquare className="size-6 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  No conversations yet
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {recentConversations.map((conv) => (
                  <div
                    key={conv.id}
                    className="flex items-center gap-3 px-6 py-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
                      <User className="size-3.5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {conv.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {conv.botName} &middot; {t.dashboard.visitor}{' '}
                        {conv.visitorId.slice(-4)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="secondary" className="text-[10px]">
                        {conv.messageCount} {t.dashboard.messagesCount}
                      </Badge>
                      <span className="text-xs text-muted-foreground w-8 text-right">
                        {timeAgo(conv.updatedAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <CreateBotDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreate={handleCreate}
      />
    </div>
  );
}

'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Bot } from '@/types';

interface UseBots {
  bots: (Bot & { messageCount: number })[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
  createBot: (data: {
    name: string;
    description: string;
    welcome_message: string;
    system_prompt: string;
    theme_color: string;
    model: string;
  }) => Promise<Bot | null>;
  deleteBot: (id: string) => Promise<boolean>;
}

export function useBots(): UseBots {
  const [bots, setBots] = useState<(Bot & { messageCount: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBots = useCallback(async () => {
    setLoading(true);
    setError(null);
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error: fetchError } = await supabase
      .from('bots')
      .select('*, conversations(count)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
      setLoading(false);
      return;
    }

    // Get message counts per bot
    const botsWithCounts = await Promise.all(
      (data ?? []).map(async (bot) => {
        const { data: convs } = await supabase
          .from('conversations')
          .select('id')
          .eq('bot_id', bot.id);

        let messageCount = 0;
        if (convs && convs.length > 0) {
          const { count } = await supabase
            .from('messages')
            .select('id', { count: 'exact', head: true })
            .in('conversation_id', convs.map((c) => c.id));
          messageCount = count ?? 0;
        }

        const { conversations: _, ...botData } = bot;
        return { ...botData, messageCount } as Bot & { messageCount: number };
      })
    );

    setBots(botsWithCounts);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchBots();
  }, [fetchBots]);

  const createBotFn = useCallback(
    async (data: {
      name: string;
      description: string;
      welcome_message: string;
      system_prompt: string;
      theme_color: string;
      model: string;
    }): Promise<Bot | null> => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return null;

      const { data: bot, error } = await supabase
        .from('bots')
        .insert({ ...data, user_id: user.id })
        .select()
        .single();

      if (error) throw error;

      setBots((prev) => [{ ...bot, messageCount: 0 }, ...prev]);
      return bot;
    },
    []
  );

  const deleteBotFn = useCallback(async (id: string): Promise<boolean> => {
    const supabase = createClient();
    const { error } = await supabase.from('bots').delete().eq('id', id);
    if (error) throw error;
    setBots((prev) => prev.filter((b) => b.id !== id));
    return true;
  }, []);

  return {
    bots,
    loading,
    error,
    refresh: fetchBots,
    createBot: createBotFn,
    deleteBot: deleteBotFn,
  };
}

import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { ChatView } from './chat-view';

export default async function ChatPage({
  params,
  searchParams,
}: {
  params: Promise<{ botId: string }>;
  searchParams: Promise<{ preview?: string }>;
}) {
  const { botId } = await params;
  const { preview } = await searchParams;

  const supabase = await createClient();

  const { data: bot } = await supabase
    .from('bots')
    .select('id, name, welcome_message, theme_color, is_public, avatar_url, user_id')
    .eq('id', botId)
    .single();

  if (!bot) {
    notFound();
  }

  // In preview mode, allow the bot owner to test non-public bots
  if (!bot.is_public) {
    if (preview === 'true') {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.id !== bot.user_id) {
        notFound();
      }
    } else {
      notFound();
    }
  }

  return (
    <ChatView
      botId={bot.id}
      botName={bot.name}
      welcomeMessage={bot.welcome_message}
      themeColor={bot.theme_color}
      avatarUrl={bot.avatar_url}
    />
  );
}

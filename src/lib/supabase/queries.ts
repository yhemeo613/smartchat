import { createClient } from '@/lib/supabase/server';
import type { Bot, Document, Conversation, Message, BotStats } from '@/types';

// ============================================================
// Bots
// ============================================================

export async function getBots(userId: string): Promise<Bot[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('bots')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getBot(id: string, userId: string): Promise<Bot | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('bots')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (error) return null;
  return data;
}

export async function createBot(
  data: Pick<Bot, 'name' | 'description' | 'welcome_message' | 'system_prompt' | 'theme_color' | 'model'> & { user_id: string }
): Promise<Bot> {
  const supabase = await createClient();
  const { data: bot, error } = await supabase
    .from('bots')
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return bot;
}

export async function updateBot(
  id: string,
  userId: string,
  data: Partial<Pick<Bot, 'name' | 'description' | 'welcome_message' | 'system_prompt' | 'theme_color' | 'model' | 'temperature' | 'max_tokens' | 'is_public'>>
): Promise<Bot> {
  const supabase = await createClient();
  const { data: bot, error } = await supabase
    .from('bots')
    .update(data)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return bot;
}

export async function deleteBot(id: string, userId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from('bots').delete().eq('id', id).eq('user_id', userId);
  if (error) throw error;
}

// ============================================================
// Documents
// ============================================================

export async function getDocuments(botId: string): Promise<Document[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('bot_id', botId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function createDocument(
  data: Pick<Document, 'bot_id' | 'name' | 'content'> & { token_count?: number; status?: Document['status'] }
): Promise<Document> {
  const supabase = await createClient();
  const { data: doc, error } = await supabase
    .from('documents')
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return doc;
}

export async function deleteDocument(id: string, userId: string): Promise<void> {
  const supabase = await createClient();

  // Verify ownership through the bot relationship
  const { data: doc, error: docError } = await supabase
    .from('documents')
    .select('bot_id')
    .eq('id', id)
    .single();

  if (docError || !doc) throw new Error('Document not found');

  const { data: bot, error: botError } = await supabase
    .from('bots')
    .select('id')
    .eq('id', doc.bot_id)
    .eq('user_id', userId)
    .single();

  if (botError || !bot) throw new Error('Unauthorized: you do not own this document');

  const { error } = await supabase.from('documents').delete().eq('id', id);
  if (error) throw error;
}

// ============================================================
// Conversations
// ============================================================

export async function getConversations(botId: string): Promise<(Conversation & { message_count: number })[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('conversations')
    .select('*, messages(count)')
    .eq('bot_id', botId)
    .order('updated_at', { ascending: false });

  if (error) throw error;

  return (data ?? []).map((conv) => ({
    ...conv,
    message_count: (conv.messages as unknown as { count: number }[])?.[0]?.count ?? 0,
  }));
}

export async function getMessages(conversationId: string): Promise<Message[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

// ============================================================
// Stats
// ============================================================

export async function getBotStats(botId: string): Promise<BotStats> {
  const supabase = await createClient();

  const { count: totalConversations } = await supabase
    .from('conversations')
    .select('id', { count: 'exact', head: true })
    .eq('bot_id', botId);

  const { data: convIds } = await supabase
    .from('conversations')
    .select('id')
    .eq('bot_id', botId);

  let totalMessages = 0;
  if (convIds && convIds.length > 0) {
    const { count } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .in('conversation_id', convIds.map((c) => c.id));
    totalMessages = count ?? 0;
  }

  const convCount = totalConversations ?? 0;

  return {
    total_conversations: convCount,
    total_messages: totalMessages,
    avg_messages_per_conversation: convCount > 0 ? Math.round(totalMessages / convCount * 10) / 10 : 0,
    top_questions: [],
  };
}

export async function getDashboardStats(userId: string) {
  const supabase = await createClient();

  // Get user's bots
  const { data: bots } = await supabase
    .from('bots')
    .select('id')
    .eq('user_id', userId);

  const botIds = bots?.map((b) => b.id) ?? [];
  const totalBots = botIds.length;

  if (totalBots === 0) {
    return {
      totalBots: 0,
      totalConversations: 0,
      totalMessages: 0,
    };
  }

  // Count conversations across all bots
  const { count: totalConversations } = await supabase
    .from('conversations')
    .select('id', { count: 'exact', head: true })
    .in('bot_id', botIds);

  // Count messages across all bot conversations
  const { data: convIds } = await supabase
    .from('conversations')
    .select('id')
    .in('bot_id', botIds);

  let totalMessages = 0;
  if (convIds && convIds.length > 0) {
    const { count } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .in('conversation_id', convIds.map((c) => c.id));
    totalMessages = count ?? 0;
  }

  return {
    totalBots,
    totalConversations: totalConversations ?? 0,
    totalMessages,
  };
}

// ============================================================
// Recent conversations (across all user's bots)
// ============================================================

export async function getRecentConversations(userId: string, limit = 5) {
  const supabase = await createClient();

  const { data: bots } = await supabase
    .from('bots')
    .select('id, name')
    .eq('user_id', userId);

  if (!bots || bots.length === 0) return [];

  const botMap = Object.fromEntries(bots.map((b) => [b.id, b.name]));
  const botIds = bots.map((b) => b.id);

  const { data: conversations, error } = await supabase
    .from('conversations')
    .select('*, messages(count)')
    .in('bot_id', botIds)
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (error) throw error;

  return (conversations ?? []).map((conv) => ({
    id: conv.id,
    botName: botMap[conv.bot_id] ?? 'Unknown Bot',
    visitorId: conv.visitor_id,
    title: conv.title || 'Untitled conversation',
    messageCount: (conv.messages as unknown as { count: number }[])?.[0]?.count ?? 0,
    updatedAt: conv.updated_at,
  }));
}

// ============================================================
// Profile
// ============================================================

export async function getProfile(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) return null;
  return data;
}

export async function updateProfile(
  userId: string,
  data: { full_name?: string; avatar_url?: string }
) {
  const supabase = await createClient();
  const { data: profile, error } = await supabase
    .from('profiles')
    .update(data)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return profile;
}

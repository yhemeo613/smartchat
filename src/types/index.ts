export interface Bot {
  id: string;
  name: string;
  description: string;
  avatar_url?: string;
  welcome_message: string;
  theme_color: string;
  model: string;
  temperature: number;
  max_tokens: number;
  system_prompt: string;
  user_id: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  bot_id: string;
  name: string;
  content: string;
  token_count: number;
  status: 'processing' | 'ready' | 'error';
  created_at: string;
}

export interface DocumentChunk {
  id: string;
  document_id: string;
  bot_id: string;
  content: string;
  embedding: number[];
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface Conversation {
  id: string;
  bot_id: string;
  visitor_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  sources?: DocumentChunk[];
  created_at: string;
}

export interface BotStats {
  total_conversations: number;
  total_messages: number;
  avg_messages_per_conversation: number;
  top_questions: { question: string; count: number }[];
}

export type Locale = 'en' | 'zh';


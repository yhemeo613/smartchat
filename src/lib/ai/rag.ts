import { generateEmbedding } from './openai';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface RetrievedContext {
  content: string;
  metadata: Record<string, unknown>;
  similarity?: number;
}

export async function retrieveContext(
  botId: string,
  query: string,
  supabase: SupabaseClient
): Promise<RetrievedContext[]> {
  if (!query.trim()) {
    return [];
  }

  const embedding = await generateEmbedding(query);

  const { data, error } = await supabase.rpc('match_documents', {
    query_embedding: embedding,
    match_bot_id: botId,
    match_threshold: 0.5,
    match_count: 5,
  });

  if (error) {
    console.error('Vector search error:', error);
    return [];
  }

  return (data || []).map((doc: { content: string; metadata?: Record<string, unknown>; similarity?: number }) => ({
    content: doc.content,
    metadata: doc.metadata || {},
    similarity: doc.similarity,
  }));
}

export function buildContextPrompt(
  systemPrompt: string,
  contexts: { content: string }[]
): string {
  if (contexts.length === 0) return systemPrompt;

  const contextBlock = contexts
    .map((ctx, i) => `[Document ${i + 1}]\n${ctx.content}`)
    .join('\n\n');

  return `${systemPrompt}

请优先根据以下参考文档来回答用户的问题。回答时不需要提及"根据文档"等字眼，用自然的语气回复即可。如果参考文档中确实没有相关信息，请坦诚告知用户你暂时没有这方面的信息，而不是自行编造答案。

<context>
${contextBlock}
</context>`;
}

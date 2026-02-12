import { openai } from './openai';
import { anthropic } from './anthropic';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface StreamChatOptions {
  model: string;
  temperature: number;
  max_tokens: number;
  messages: ChatMessage[];
}

interface ChatChunk {
  text: string;
}

function isAnthropicModel(model: string): boolean {
  return model.startsWith('claude-');
}

async function* streamOpenAI(options: StreamChatOptions): AsyncIterable<ChatChunk> {
  const stream = await openai.chat.completions.create({
    model: options.model,
    temperature: options.temperature,
    max_tokens: options.max_tokens,
    stream: true,
    messages: options.messages,
  });

  for await (const chunk of stream) {
    const text = chunk.choices[0]?.delta?.content || '';
    if (text) {
      yield { text };
    }
  }
}

async function* streamAnthropic(options: StreamChatOptions): AsyncIterable<ChatChunk> {
  // Extract system message — Anthropic requires it as a separate parameter
  const systemMessage = options.messages.find((m) => m.role === 'system');
  const nonSystemMessages = options.messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

  try {
    const stream = anthropic.messages.stream({
      model: options.model,
      max_tokens: options.max_tokens,
      temperature: options.temperature,
      system: systemMessage?.content ?? '',
      messages: nonSystemMessages,
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        yield { text: event.delta.text };
      }
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : JSON.stringify(error);
    console.error('Anthropic stream error:', message);
    throw new Error(`Anthropic API error: ${message}`);
  }
}

export async function* streamChat(options: StreamChatOptions): AsyncIterable<ChatChunk> {
  if (isAnthropicModel(options.model)) {
    yield* streamAnthropic(options);
  } else {
    yield* streamOpenAI(options);
  }
}

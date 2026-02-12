import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { getPresetById } from './providers';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIConfig {
  provider: string;
  apiKey: string;
  baseUrl?: string;
}

interface StreamChatOptions {
  model: string;
  temperature: number;
  max_tokens: number;
  messages: ChatMessage[];
  aiConfig: AIConfig;
}

interface ChatChunk {
  text: string;
}

function shouldUseAnthropicSdk(config: AIConfig): boolean {
  const preset = getPresetById(config.provider);
  return preset?.useAnthropicSdk === true;
}

async function* streamOpenAI(options: StreamChatOptions): AsyncIterable<ChatChunk> {
  if (!options.aiConfig.apiKey) {
    throw new Error('API Key is not configured. Please set it in Settings.');
  }
  const client = new OpenAI({
    apiKey: options.aiConfig.apiKey,
    baseURL: options.aiConfig.baseUrl || undefined,
  });
  const stream = await client.chat.completions.create({
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
  if (!options.aiConfig.apiKey) {
    throw new Error('API Key is not configured. Please set it in Settings.');
  }
  const client = new Anthropic({
    apiKey: options.aiConfig.apiKey,
    baseURL: options.aiConfig.baseUrl || undefined,
  });
  const systemMessage = options.messages.find((m) => m.role === 'system');
  const nonSystemMessages = options.messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

  try {
    const stream = client.messages.stream({
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
  if (shouldUseAnthropicSdk(options.aiConfig)) {
    yield* streamAnthropic(options);
  } else {
    yield* streamOpenAI(options);
  }
}

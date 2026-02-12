import OpenAI from 'openai';

export const EMBEDDING_MODELS = [
  { value: 'text-embedding-v3', label: '通义千问 text-embedding-v3 (免费额度)', group: 'Remote' },
  { value: 'local-bge-small-zh-v1.5', label: 'Local: BGE-small-zh (Free, 中文优化)', group: 'Local (Free)' },
  { value: 'local-all-MiniLM-L6-v2', label: 'Local: all-MiniLM-L6-v2 (Free)', group: 'Local (Free)' },
] as const;

export type EmbeddingModel = (typeof EMBEDDING_MODELS)[number]['value'];

// Cache local pipelines to avoid reloading models on every call
const localPipelineCache: Record<string, Promise<unknown>> = {};

function getLocalPipeline(modelName: string) {
  if (!localPipelineCache[modelName]) {
    localPipelineCache[modelName] = (async () => {
      const { pipeline, env } = await import('@huggingface/transformers');
      // Use HuggingFace mirror for China mainland access
      env.remoteHost = 'https://hf-mirror.com';
      env.remotePathTemplate = '{model}/resolve/{revision}/';
      return pipeline('feature-extraction', modelName);
    })();
  }
  return localPipelineCache[modelName];
}

const LOCAL_MODEL_MAP: Record<string, string> = {
  'local-bge-small-zh-v1.5': 'BAAI/bge-small-zh-v1.5',
  'local-all-MiniLM-L6-v2': 'Xenova/all-MiniLM-L6-v2',
};

async function generateLocalEmbedding(text: string, model: EmbeddingModel): Promise<number[]> {
  const hfModel = LOCAL_MODEL_MAP[model] || 'Xenova/all-MiniLM-L6-v2';
  const extractor = await getLocalPipeline(hfModel) as (text: string, options: { pooling: string; normalize: boolean }) => Promise<{ tolist: () => number[][] }>;
  const output = await extractor(text, { pooling: 'mean', normalize: true });
  return output.tolist()[0];
}

export async function generateEmbedding(
  text: string,
  model: EmbeddingModel = 'text-embedding-v3',
  openaiConfig?: { apiKey: string; baseUrl?: string }
): Promise<number[]> {
  if (model.startsWith('local-')) {
    try {
      return await generateLocalEmbedding(text, model);
    } catch {
      console.warn('Local embedding model unavailable (e.g. on Vercel), skipping.');
      return [];
    }
  }

  // Use provided config or fall back to DASHSCOPE env vars for Qwen embedding
  const apiKey = openaiConfig?.apiKey || process.env.DASHSCOPE_API_KEY;
  const baseUrl = openaiConfig?.baseUrl || 'https://dashscope.aliyuncs.com/compatible-mode/v1';

  if (!apiKey) {
    console.warn('No embedding API key configured, skipping.');
    return [];
  }

  const client = new OpenAI({
    apiKey,
    baseURL: baseUrl,
  });

  try {
    const response = await client.embeddings.create({
      model,
      input: text,
      dimensions: 512,
    });
    return response.data[0].embedding;
  } catch (error) {
    throw new Error(`Failed to generate embedding: ${(error as Error).message}`);
  }
}

const CJK_REGEX = /[\u4e00-\u9fff\u3400-\u4dbf\u3000-\u303f\uff00-\uffef\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af]/;

export async function splitTextIntoChunks(
  text: string,
  maxChunkSize = 500,
  overlap = 50
): Promise<string[]> {
  const sentences = text.split(/(?<=[.!?。！？\n])\s*/);
  const chunks: string[] = [];
  let currentChunk = '';
  const isCJK = CJK_REGEX.test(text);

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > maxChunkSize && currentChunk) {
      chunks.push(currentChunk.trim());
      if (isCJK) {
        currentChunk = currentChunk.slice(-overlap) + sentence;
      } else {
        const words = currentChunk.split(' ');
        currentChunk = words.slice(-overlap).join(' ') + ' ' + sentence;
      }
    } else {
      currentChunk += (currentChunk ? (isCJK ? '' : ' ') : '') + sentence;
    }
  }
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }
  return chunks;
}

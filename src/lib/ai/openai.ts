import OpenAI from 'openai';

export const openai = new OpenAI({
  apiKey: process.env.ANTHROPIC_API_KEY,
  baseURL: process.env.ANTHROPIC_BASE_URL,
});

export const EMBEDDING_MODELS = [
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

export async function generateEmbedding(text: string, model: EmbeddingModel = 'local-all-MiniLM-L6-v2'): Promise<number[]> {
  if (model.startsWith('local-')) {
    return generateLocalEmbedding(text, model);
  }

  try {
    const response = await openai.embeddings.create({
      model,
      input: text,
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
): string[] {
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

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateEmbedding, splitTextIntoChunks, EMBEDDING_MODELS, type EmbeddingModel } from '@/lib/ai/openai';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const SUPPORTED_TYPES: Record<string, string> = {
  'application/pdf': 'pdf',
  'text/plain': 'txt',
  'text/markdown': 'md',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
};

async function extractText(file: File): Promise<string> {
  const type = file.type || '';
  const ext = file.name.split('.').pop()?.toLowerCase();

  if (type === 'application/pdf' || ext === 'pdf') {
    const buffer = Buffer.from(await file.arrayBuffer());
    const pdfParse = (await import('pdf-parse')).default;
    const result = await pdfParse(buffer);
    return result.text;
  }

  if (ext === 'doc' || ext === 'docx') {
    const buffer = Buffer.from(await file.arrayBuffer());

    // Try mammoth first (for .docx)
    if (ext === 'docx') {
      try {
        const mammoth = await import('mammoth');
        const result = await mammoth.extractRawText({ buffer });
        if (result.value.trim()) return result.value;
      } catch {
        // Fall through to word-extractor
      }
    }

    // Use word-extractor for .doc or as fallback for .docx
    try {
      const WordExtractor = (await import('word-extractor')).default;
      const extractor = new WordExtractor();
      const doc = await extractor.extract(buffer);
      return doc.getBody();
    } catch (e) {
      console.error('DOC/DOCX parse error:', e);
      throw new Error('Failed to parse Word file. Please make sure it is a valid .doc or .docx file.');
    }
  }

  return await file.text();
}

export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const botId = formData.get('botId') as string | null;
    const embeddingModel = (formData.get('embeddingModel') as EmbeddingModel | null) || 'local-all-MiniLM-L6-v2';

    // Validate embedding model
    const validModels = EMBEDDING_MODELS.map((m) => m.value);
    if (!validModels.includes(embeddingModel)) {
      return NextResponse.json({ error: 'Invalid embedding model' }, { status: 400 });
    }

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Maximum size is 20MB.' }, { status: 400 });
    }
    if (!botId) {
      return NextResponse.json({ error: 'No botId provided' }, { status: 400 });
    }

    // Verify bot ownership
    const { data: bot } = await supabase
      .from('bots')
      .select('id')
      .eq('id', botId)
      .eq('user_id', user.id)
      .single();

    if (!bot) {
      return NextResponse.json({ error: 'Bot not found' }, { status: 404 });
    }

    const ext = file.name.split('.').pop()?.toLowerCase();
    const isSupported =
      SUPPORTED_TYPES[file.type] || ['pdf', 'txt', 'md', 'doc', 'docx'].includes(ext || '');
    if (!isSupported) {
      return NextResponse.json(
        { error: 'Unsupported file type. Supported: PDF, TXT, MD, DOC, DOCX' },
        { status: 400 }
      );
    }

    const text = await extractText(file);
    if (!text.trim()) {
      return NextResponse.json({ error: 'File contains no text content' }, { status: 400 });
    }

    const { data: doc, error: docError } = await supabase
      .from('documents')
      .insert({
        bot_id: botId,
        name: file.name,
        content: text,
        status: 'processing',
      })
      .select()
      .single();

    if (docError) {
      console.error('Document insert error:', docError);
      return NextResponse.json({ error: 'Failed to create document record' }, { status: 500 });
    }

    try {
      const chunks = await splitTextIntoChunks(text);
      const chunkRecords = [];
      let totalTokens = 0;

      // Fetch user's AI config for non-local embedding models
      const { data: profile } = await supabase
        .from('profiles')
        .select('openai_api_key, openai_base_url')
        .eq('id', user.id)
        .single();

      const openaiConfig = profile?.openai_api_key
        ? { apiKey: profile.openai_api_key, baseUrl: profile.openai_base_url || undefined }
        : undefined;

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const embedding = await generateEmbedding(chunk, embeddingModel, openaiConfig);
        totalTokens += Math.ceil(chunk.length / 4);

        chunkRecords.push({
          document_id: doc.id,
          bot_id: botId,
          content: chunk,
          embedding: embedding,
          metadata: {
            chunk_index: i,
            document_name: file.name,
          },
        });
      }

      // Insert chunks in batches to avoid payload size limits
      const BATCH_SIZE = 10;
      for (let b = 0; b < chunkRecords.length; b += BATCH_SIZE) {
        const batch = chunkRecords.slice(b, b + BATCH_SIZE);
        const { error: chunkError } = await supabase
          .from('document_chunks')
          .insert(batch);

        if (chunkError) {
          throw new Error(`Chunk insert error: ${chunkError.message}`);
        }
      }

      const { error: updateError } = await supabase
        .from('documents')
        .update({ status: 'ready', token_count: totalTokens })
        .eq('id', doc.id);

      if (updateError) {
        throw new Error(`Document update error: ${updateError.message}`);
      }

      return NextResponse.json({
        id: doc.id,
        bot_id: botId,
        name: file.name,
        token_count: totalTokens,
        chunk_count: chunks.length,
        status: 'ready',
        created_at: doc.created_at,
      });
    } catch (processingError) {
      await supabase
        .from('documents')
        .update({ status: 'error' })
        .eq('id', doc.id);

      console.error('Processing error:', processingError);
      return NextResponse.json(
        { error: 'Failed to process document' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}

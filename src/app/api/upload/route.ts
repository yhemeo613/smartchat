import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateEmbedding, splitTextIntoChunks, EMBEDDING_MODELS, type EmbeddingModel } from '@/lib/ai/openai';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const SUPPORTED_EXTS = ['pdf', 'txt', 'md', 'doc', 'docx'];

async function extractText(buffer: Buffer, ext: string): Promise<string> {
  if (ext === 'pdf') {
    const pdfParse = (await import('pdf-parse')).default;
    const result = await pdfParse(buffer);
    return result.text;
  }

  if (ext === 'doc' || ext === 'docx') {
    if (ext === 'docx') {
      try {
        const mammoth = await import('mammoth');
        const result = await mammoth.extractRawText({ buffer });
        if (result.value.trim()) return result.value;
      } catch {
        // Fall through to word-extractor
      }
    }

    try {
      const WordExtractor = (await import('word-extractor')).default;
      const extractor = new WordExtractor();
      const doc = await extractor.extract(buffer);
      return doc.getBody();
    } catch (e) {
      console.error('DOC/DOCX parse error:', e);
      throw new Error('Failed to parse Word file.');
    }
  }

  return buffer.toString('utf-8');
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { filePath, fileName, botId, embeddingModel: reqModel } = await req.json();

    if (!filePath || !fileName || !botId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const embeddingModel: EmbeddingModel = reqModel || 'text-embedding-v3';
    const validModels = EMBEDDING_MODELS.map((m) => m.value);
    if (!validModels.includes(embeddingModel)) {
      return NextResponse.json({ error: 'Invalid embedding model' }, { status: 400 });
    }

    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    if (!SUPPORTED_EXTS.includes(ext)) {
      return NextResponse.json(
        { error: 'Unsupported file type. Supported: PDF, TXT, MD, DOC, DOCX' },
        { status: 400 }
      );
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

    // Download file from Supabase Storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('documents')
      .download(filePath);

    if (downloadError || !fileData) {
      return NextResponse.json({ error: 'Failed to download file from storage' }, { status: 500 });
    }

    const buffer = Buffer.from(await fileData.arrayBuffer());
    const text = await extractText(buffer, ext);

    if (!text.trim()) {
      return NextResponse.json({ error: 'File contains no text content' }, { status: 400 });
    }

    const { data: doc, error: docError } = await supabase
      .from('documents')
      .insert({
        bot_id: botId,
        name: fileName,
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

      // Process and insert chunks in batches
      const BATCH_SIZE = 10;
      for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
        const batch = chunks.slice(i, i + BATCH_SIZE);
        const chunkRecords = [];

        for (let j = 0; j < batch.length; j++) {
          const chunk = batch[j];
          const embedding = await generateEmbedding(chunk, embeddingModel, openaiConfig);
          totalTokens += Math.ceil(chunk.length / 4);

          chunkRecords.push({
            document_id: doc.id,
            bot_id: botId,
            content: chunk,
            embedding,
            metadata: {
              chunk_index: i + j,
              document_name: fileName,
            },
          });
        }

        const { error: chunkError } = await supabase
          .from('document_chunks')
          .insert(chunkRecords);

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
        name: fileName,
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

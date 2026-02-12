import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { streamChat } from '@/lib/ai/provider';
import { retrieveContext, buildContextPrompt } from '@/lib/ai/rag';

export async function POST(req: NextRequest) {
  try {
    const { botId, message, conversationId, visitorId } = await req.json();

    if (!botId || !message) {
      return NextResponse.json(
        { error: 'botId and message are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Fetch bot configuration
    const { data: bot, error: botError } = await supabase
      .from('bots')
      .select('*')
      .eq('id', botId)
      .single();

    if (botError || !bot) {
      return NextResponse.json({ error: 'Bot not found' }, { status: 404 });
    }

    // If bot is not public, verify the current user is the owner (preview mode)
    if (!bot.is_public) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.id !== bot.user_id) {
        return NextResponse.json({ error: 'Bot not found or not public' }, { status: 404 });
      }
    }

    // Get or create conversation
    let convId = conversationId;
    if (!convId) {
      const { data: conv, error: convError } = await supabase
        .from('conversations')
        .insert({
          bot_id: botId,
          visitor_id: visitorId || `anon_${Date.now()}`,
          title: message.slice(0, 100),
        })
        .select('id')
        .single();

      if (convError) {
        console.error('Conversation create error:', convError);
        return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
      }
      convId = conv.id;
    }

    // Save user message
    await supabase.from('messages').insert({
      conversation_id: convId,
      role: 'user',
      content: message,
    });

    // RAG: retrieve relevant context
    const contexts = await retrieveContext(botId, message, supabase);

    // Build system prompt with context
    const systemPrompt = buildContextPrompt(bot.system_prompt, contexts);

    // Fetch recent conversation history (last 10 messages)
    const { data: history } = await supabase
      .from('messages')
      .select('role, content')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true })
      .limit(10);

    const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
      { role: 'system', content: systemPrompt },
    ];

    if (history && history.length > 0) {
      for (const msg of history) {
        if (msg.role === 'system') continue;
        messages.push({ role: msg.role as 'user' | 'assistant', content: msg.content });
      }
    }

    // Ensure the current user message is included (it may already be in history)
    const lastMsg = messages[messages.length - 1];
    if (lastMsg.role !== 'user' || lastMsg.content !== message) {
      messages.push({ role: 'user', content: message });
    }

    // Prepare sources for response
    const sources = contexts.map((ctx) => ({
      content: ctx.content.slice(0, 200),
      metadata: ctx.metadata,
      similarity: ctx.similarity,
    }));

    // Stream AI response via provider
    const chatStream = streamChat({
      model: bot.model || 'gpt-4o-mini',
      temperature: bot.temperature ?? 0.7,
      max_tokens: bot.max_tokens || 1000,
      messages,
    });

    const encoder = new TextEncoder();
    let fullResponse = '';

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of chatStream) {
            fullResponse += chunk.text;
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ text: chunk.text })}\n\n`)
            );
          }

          // Send sources
          if (sources.length > 0) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ sources })}\n\n`)
            );
          }

          // Send done signal
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ done: true, conversationId: convId })}\n\n`
            )
          );

          controller.close();

          // Save assistant response after stream ends
          await supabase.from('messages').insert({
            conversation_id: convId,
            role: 'assistant',
            content: fullResponse,
            sources: sources,
          });
        } catch (streamError) {
          console.error('Stream error:', streamError);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: 'Stream interrupted' })}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

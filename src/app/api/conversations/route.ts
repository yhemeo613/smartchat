import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const botId = req.nextUrl.searchParams.get('bot_id');
  if (!botId) {
    return NextResponse.json({ error: 'bot_id is required' }, { status: 400 });
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

  const { data, error } = await supabase
    .from('conversations')
    .select('*, messages(count)')
    .eq('bot_id', botId)
    .order('updated_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const conversations = (data ?? []).map((conv) => ({
    ...conv,
    message_count:
      (conv.messages as unknown as { count: number }[])?.[0]?.count ?? 0,
  }));

  return NextResponse.json(conversations);
}

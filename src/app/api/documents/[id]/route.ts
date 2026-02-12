import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify document belongs to user's bot
  const { data: doc } = await supabase
    .from('documents')
    .select('id, bot_id, bots!inner(user_id)')
    .eq('id', id)
    .single();

  if (!doc) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 });
  }

  // Verify the bot belongs to the authenticated user
  const botData = doc.bots as unknown as { user_id: string };
  if (botData.user_id !== user.id) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 });
  }

  const { error } = await supabase.from('documents').delete().eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('ai_provider, ai_api_key, ai_base_url, default_model')
    .eq('id', user.id)
    .single();

  if (error) {
    return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 });
  }

  return NextResponse.json({
    ai_provider: profile.ai_provider || 'openai',
    ai_api_key: profile.ai_api_key ? `****${profile.ai_api_key.slice(-4)}` : '',
    ai_base_url: profile.ai_base_url || '',
    default_model: profile.default_model || 'gpt-4o-mini',
    has_api_key: !!profile.ai_api_key,
  });
}

export async function PUT(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const updates: Record<string, string | null> = {};

  if ('ai_provider' in body) {
    updates.ai_provider = body.ai_provider || 'openai';
  }

  if ('ai_api_key' in body) {
    const val = body.ai_api_key?.trim();
    if (val && !val.startsWith('****')) {
      updates.ai_api_key = val;
    } else if (val === '') {
      updates.ai_api_key = null;
    }
  }

  if ('ai_base_url' in body) {
    updates.ai_base_url = body.ai_base_url?.trim() || null;
  }

  if ('default_model' in body) {
    updates.default_model = body.default_model;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ message: 'No changes' });
  }

  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id);

  if (error) {
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }

  return NextResponse.json({ message: 'Settings saved' });
}

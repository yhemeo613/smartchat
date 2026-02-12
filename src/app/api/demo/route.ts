import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET: fetch current user's demo quota
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Not logged in — use a default guest quota
    return NextResponse.json({ quota: 3, used: 0, loggedIn: false });
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('message_quota, message_used')
    .eq('id', user.id)
    .single();

  if (error || !profile) {
    return NextResponse.json({ quota: 3, used: 0, loggedIn: true });
  }

  return NextResponse.json({
    quota: profile.message_quota,
    used: profile.message_used,
    loggedIn: true,
  });
}

// POST: increment usage by 1
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile, error: fetchError } = await supabase
    .from('profiles')
    .select('message_quota, message_used')
    .eq('id', user.id)
    .single();

  if (fetchError || !profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  if (profile.message_used >= profile.message_quota) {
    return NextResponse.json({ error: 'Quota exceeded' }, { status: 403 });
  }

  const newUsed = profile.message_used + 1;
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ message_used: newUsed })
    .eq('id', user.id);

  if (updateError) {
    return NextResponse.json({ error: 'Failed to update usage' }, { status: 500 });
  }

  return NextResponse.json({
    quota: profile.message_quota,
    used: newUsed,
  });
}

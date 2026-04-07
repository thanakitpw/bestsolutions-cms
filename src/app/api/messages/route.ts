import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const filter = searchParams.get('filter') || 'all';

  let query = supabaseAdmin
    .from('messages')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (filter === 'unread') query = query.eq('is_read', false).eq('is_archived', false);
  if (filter === 'archived') query = query.eq('is_archived', true);
  if (filter === 'all') query = query.eq('is_archived', false);

  const { data, count, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ messages: data, total: count });
}

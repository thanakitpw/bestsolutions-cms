import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

// GET /api/admin/settings — return all site_settings as { key: value } object
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('site_settings')
    .select('key, value');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const settings: Record<string, string> = {};
  for (const row of data ?? []) {
    settings[row.key] = row.value;
  }

  return NextResponse.json(settings);
}

// PUT /api/admin/settings — upsert multiple settings { key: value, ... }
export async function PUT(request: NextRequest) {
  const body = await request.json();

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  const upsertRows = Object.entries(body as Record<string, string>).map(
    ([key, value]) => ({ key, value })
  );

  if (upsertRows.length === 0) {
    return NextResponse.json({ error: 'No data provided' }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from('site_settings')
    .upsert(upsertRows, { onConflict: 'key' });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

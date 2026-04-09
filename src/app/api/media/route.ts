import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

// GET /api/admin/media — list all media records
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const search = searchParams.get('search');

  let query = supabaseAdmin
    .from('media')
    .select('*')
    .order('created_at', { ascending: false });

  if (search) {
    query = query.or(`filename.ilike.%${search}%,alt_text.ilike.%${search}%`);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ media: data });
}

// POST /api/admin/media — insert new media record
export async function POST(request: NextRequest) {
  const body = await request.json();

  const { url, alt_text, filename, file_size, mime_type } = body;

  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('media')
    .insert({
      url,
      alt_text: alt_text || '',
      filename: filename || url.split('/').pop() || 'untitled',
      file_size: file_size || null,
      mime_type: mime_type || 'image/jpeg',
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { checkRateLimit } from '@/lib/rate-limit';


export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role') || '';
    const status = searchParams.get('status') || '';
    const search = searchParams.get('search') || '';

    let query = supabase.from('users').select('*').order('created_at', { ascending: false });

    if (role && role !== 'all') query = query.eq('role', role);
    if (status === 'active') query = query.eq('is_active', true);
    else if (status === 'inactive') query = query.eq('is_active', false);
    if (search) query = query.or(`full_name.ilike.%${search}%,username.ilike.%${search}%,phone.ilike.%${search}%`);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json([], { status: 500 });
  }
}
export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  
  const { allowed, retryAfter } = checkRateLimit(`create-user:${ip}`, 3, 60000);
  
  if (!allowed) {
    return NextResponse.json(
      { error: `محاولات كثيرة جداً. حاول مرة أخرى بعد ${retryAfter} ثانية` },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const { full_name, username, password_hash, phone, role } = body;

    const { data, error } = await supabase
      .from('users')
      .insert([{
        full_name,
        username,
        email: `${username}@warehouse.com`,
        password_hash,
        phone,
        role,
        is_active: true,
      }])
      .select()
      .single();

    if (error) {
      console.error('Error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    console.error('Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
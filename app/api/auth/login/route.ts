import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { checkRateLimit, resetRateLimit } from '@/lib/rate-limit';

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  
  const { allowed, retryAfter } = checkRateLimit(`login:${ip}`, 5, 60000);
  
  if (!allowed) {
    return NextResponse.json(
      { error: `محاولات كثيرة جداً. حاول مرة أخرى بعد ${retryAfter} ثانية` },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const { email, password } = body;

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .or(`username.eq.${email},email.eq.${email}`)
      .eq('password_hash', password)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'بيانات الدخول غير صحيحة' }, { status: 401 });
    }

    resetRateLimit(`login:${ip}`);

    return NextResponse.json({
      success: true,
      user: { id: data.id, full_name: data.full_name, username: data.username, role: data.role },
    });
  } catch {
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
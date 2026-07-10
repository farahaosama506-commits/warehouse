import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('*');

    if (error) throw error;

    const settings: any = {};
    data?.forEach((row: any) => {
      settings[row.key] = row.value;
    });

    return NextResponse.json(settings);
  } catch {
    return NextResponse.json({});
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    for (const [key, value] of Object.entries(body)) {
      await supabase
        .from('settings')
        .upsert({ key, value: String(value) }, { onConflict: 'key' });
    }

    return NextResponse.json({ success: true, message: 'تم حفظ الإعدادات بنجاح' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
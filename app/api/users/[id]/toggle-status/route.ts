import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data: user } = await supabase.from('users').select('is_active').eq('id', id).single();
    const newStatus = !user?.is_active;

    const { data, error } = await supabase
      .from('users')
      .update({ is_active: newStatus })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
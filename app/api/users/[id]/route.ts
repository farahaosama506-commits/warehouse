import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { full_name, username, phone, role, is_active, password_hash } = body;

    const updateData: any = { full_name, username, phone, role, is_active };
    if (password_hash) updateData.password_hash = password_hash;
    if (username) updateData.email = `${username}@warehouse.com`;

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { error } = await supabase.from('users').update({ is_active: false }).eq('id', id);
    if (error) throw error;
    return NextResponse.json({ message: 'Deactivated' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
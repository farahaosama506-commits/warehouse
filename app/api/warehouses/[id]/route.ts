import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, address, description, storage_type, total_capacity, is_active } = body;

    const { data, error } = await supabase
      .from('warehouses')
      .update({ name, address, description, storage_type, total_capacity, is_active })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Error updating warehouse' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { error } = await supabase
      .from('warehouses')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ message: 'Deleted' });
  } catch (error) {
    return NextResponse.json({ error: 'Error deleting warehouse' }, { status: 500 });
  }
}
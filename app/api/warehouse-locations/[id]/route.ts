import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { data, error } = await supabase.from('warehouse_locations')
      .update({ section: body.section, shelf: body.shelf, col: body.column, cell: body.cell, capacity: body.capacity })
      .eq('id', id).select().single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) { return NextResponse.json({ error: error.message }, { status: 500 }); }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await supabase.from('warehouse_locations').delete().eq('id', id);
    return NextResponse.json({ success: true });
  } catch (error: any) { return NextResponse.json({ error: error.message }, { status: 500 }); }
}
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { section, shelf, column, cell, capacity } = body;

    const { data, error } = await supabase
      .from('warehouse_locations')
      .update({ section, shelf, col: column, cell, capacity })
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
    const { error } = await supabase
      .from('warehouse_locations')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ message: 'Deleted' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const warehouseId = searchParams.get('warehouse_id');

    let query = supabase
      .from('warehouse_locations')
      .select(`*, warehouse:warehouse_id (name)`)
      .order('created_at', { ascending: false });

    if (warehouseId) {
      query = query.eq('warehouse_id', warehouseId);
    }

    const { data, error } = await query;
    if (error) throw error;

    const locations = data.map((loc: any) => ({
      ...loc,
      column: loc.col,
      warehouse_name: loc.warehouse?.name || '',
    }));

    return NextResponse.json(locations);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Received body:', body);

    const insertData = {
      warehouse_id: body.warehouse_id,
      section: body.section,
      shelf: body.shelf,
      col: body.column,
      cell: body.cell,
      capacity: body.capacity || 100,
      current_occupancy: 0,
      storage_type: body.storage_type || 'dry',
    };

    console.log('Inserting:', insertData);

    const { data, error } = await supabase
      .from('warehouse_locations')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error.message, error.details);
      return NextResponse.json({ error: error.message, details: error.details }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    console.error('Catch error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
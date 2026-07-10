import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const warehouseId = searchParams.get('warehouse_id');

    let query = supabase
      .from('warehouse_locations')
      .select(`*, warehouse:warehouse_id (name)`)
      .order('created_at', { ascending: false });

    if (warehouseId) query = query.eq('warehouse_id', warehouseId);

    const { data, error } = await query;
    if (error) throw error;

    const locations = data.map((loc: any) => ({
      ...loc,
      column: loc.col,
      warehouse_name: loc.warehouse?.name || '',
    }));

    return NextResponse.json(locations);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { warehouse_id, section, shelf, column, cell, capacity, storage_type } = body;

    const { data, error } = await supabase
      .from('warehouse_locations')
      .insert([{ 
        warehouse_id, section, shelf, col: column, cell, 
        capacity: capacity || 100, current_occupancy: 0,
        storage_type: storage_type || 'dry'
      }])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('measurement_units')
      .select('*')
      .order('name');

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching units:', error);
    return NextResponse.json({ error: 'Error fetching units' }, { status: 500 });
  }
}
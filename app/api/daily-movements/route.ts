import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('daily_movements')
      .select(`*, product:product_id (name, barcode), user:user_id (full_name), order:order_id (order_number, type)`)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    const movements = data.map((m: any) => ({
      ...m,
      product_name: m.product?.name || '',
      product_barcode: m.product?.barcode || '',
      user_name: m.user?.full_name || '',
      order_number: m.order?.order_number || '',
    }));

    return NextResponse.json(movements);
  } catch (error: any) {
    console.error('Error:', error.message);
    return NextResponse.json([], { status: 500 });
  }
}
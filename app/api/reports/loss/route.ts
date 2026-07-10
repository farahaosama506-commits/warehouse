import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // منتجات منتهية الصلاحية
    const { data: expiredProducts, error } = await supabase
      .from('products')
      .select('*, location:location_id (warehouse:warehouse_id (name))')
      .lt('expiry_date', new Date().toISOString())
      .gt('current_stock', 0)
      .eq('is_active', true);

    if (error) throw error;

    const losses = (expiredProducts || []).map(product => ({
      id: product.id,
      product: product.name,
      barcode: product.barcode,
      quantity: product.current_stock,
      reason: 'منتهي الصلاحية',
      value: product.current_stock * (product.purchase_price || 0),
      date: product.expiry_date,
      warehouse: product.location?.warehouse?.name || '-',
    }));

    const totalLossValue = losses.reduce((sum, l) => sum + l.value, 0);
    const totalLossItems = losses.reduce((sum, l) => sum + l.quantity, 0);
    const expiredCount = losses.length;

    return NextResponse.json({
      losses,
      summary: { totalLossValue, totalLossItems, expiredCount, damagedCount: 0 },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}
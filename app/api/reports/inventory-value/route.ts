import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select(`
        current_stock,
        purchase_price,
        location:location_id (
          warehouse:warehouse_id (name)
        )
      `)
      .eq('is_active', true);

    if (error) throw error;

    const warehouseMap = new Map<string, { totalItems: number; totalValue: number }>();

    products?.forEach((product: any) => {
      const warehouseName = product.location?.warehouse?.name || 'بدون مستودع';
      const current = warehouseMap.get(warehouseName) || { totalItems: 0, totalValue: 0 };
      
      current.totalItems += product.current_stock;
      current.totalValue += product.current_stock * (product.purchase_price || 0);
      
      warehouseMap.set(warehouseName, current);
    });

    const warehouseData = Array.from(warehouseMap.entries()).map(([name, data]) => ({
      warehouse: name,
      totalItems: data.totalItems,
      totalValue: data.totalValue,
    }));

    const totalValue = warehouseData.reduce((sum, w) => sum + w.totalValue, 0);
    const totalItems = warehouseData.reduce((sum, w) => sum + w.totalItems, 0);

    return NextResponse.json({
      totalValue,
      totalItems,
      averageValue: warehouseData.length > 0 ? Math.round(totalValue / warehouseData.length) : 0,
      warehouseData,
    });
  } catch {
    return NextResponse.json({ totalValue: 0, totalItems: 0, averageValue: 0, warehouseData: [] });
  }
}
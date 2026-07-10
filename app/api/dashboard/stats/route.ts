import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // إحصائيات المنتجات
    const { count: totalProducts } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });

    // إحصائيات المستودعات
    const { count: activeWarehouses } = await supabase
      .from('warehouses')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    // أوامر اليوم
    const today = new Date().toISOString().split('T')[0];
    const { count: todayOrders } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today);

    // منتجات منخفضة المخزون
    const { data: lowStockProducts } = await supabase
      .from('products')
      .select('*');

    const lowStockCount = lowStockProducts?.filter(
      product => product.current_stock <= product.min_stock
    ).length || 0;

    // قيمة المخزون
    const { data: inventoryValue } = await supabase
      .from('products')
      .select('current_stock, purchase_price');

    const totalInventoryValue = inventoryValue?.reduce(
      (sum, item) => sum + (item.current_stock * item.purchase_price), 0
    ) || 0;

    return NextResponse.json({
      totalProducts: totalProducts || 0,
      activeWarehouses: activeWarehouses || 0,
      todayOrders: todayOrders || 0,
      lowStockCount: lowStockCount || 0,
      totalInventoryValue: totalInventoryValue || 0,
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { 
        totalProducts: 0,
        activeWarehouses: 0,
        todayOrders: 0,
        lowStockCount: 0,
        totalInventoryValue: 0,
        error: 'Error fetching dashboard stats' 
      }, 
      { status: 500 }
    );
  }
}
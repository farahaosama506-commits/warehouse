import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // المنتجات الأكثر مبيعاً (من حركات التجهيز)
    const { data: salesData, error } = await supabase
      .from('daily_movements')
      .select(`
        quantity,
        product:product_id (name, current_stock)
      `)
      .eq('type', 'dispatch')
      .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()); // آخر 90 يوم

    if (error) throw error;

    // تجميع المبيعات حسب المنتج
    const salesMap = new Map<string, { name: string; sales: number; stock: number }>();

    salesData?.forEach(movement => {
      const productName = movement.product?.name || 'غير معروف';
      const current = salesMap.get(productName) || { 
        name: productName, 
        sales: 0, 
        stock: movement.product?.current_stock || 0 
      };
      current.sales += movement.quantity;
      salesMap.set(productName, current);
    });

    const products = Array.from(salesMap.values())
      .sort((a, b) => b.sales - a.sales)
      .map(product => {
        const ratio = product.stock > 0 ? (product.sales / product.stock) * 100 : 0;
        let velocity: string;
        let status: string;
        
        if (ratio >= 100) { velocity = 'عالي جداً'; status = 'completed'; }
        else if (ratio >= 50) { velocity = 'عالي'; status = 'completed'; }
        else if (ratio >= 20) { velocity = 'متوسط'; status = 'processing'; }
        else if (ratio >= 5) { velocity = 'بطيء'; status = 'pending'; }
        else { velocity = 'راكد'; status = 'cancelled'; }

        return { ...product, velocity, status, ratio };
      });

    const highVelocity = products.filter(p => p.status === 'completed').length;
    const mediumVelocity = products.filter(p => p.status === 'processing').length;
    const lowVelocity = products.filter(p => p.status === 'cancelled').length;
    const totalSales = products.reduce((sum, p) => sum + p.sales, 0);

    return NextResponse.json({
      products,
      summary: { highVelocity, mediumVelocity, lowVelocity, totalSales },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}
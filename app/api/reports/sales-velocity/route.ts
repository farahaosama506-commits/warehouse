import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data: salesData, error } = await supabase
      .from('daily_movements')
      .select(`
        quantity,
        product:product_id (name, current_stock)
      `)
      .eq('type', 'dispatch')
      .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString());

    if (error) throw error;

    const salesMap = new Map<string, { name: string; sales: number; stock: number }>();

    salesData?.forEach((movement: any) => {
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
      .map((product: any) => {
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

    const highVelocity = products.filter((p: any) => p.status === 'completed').length;
    const mediumVelocity = products.filter((p: any) => p.status === 'processing').length;
    const lowVelocity = products.filter((p: any) => p.status === 'cancelled').length;
    const totalSales = products.reduce((sum: number, p: any) => sum + p.sales, 0);

    return NextResponse.json({ products, summary: { highVelocity, mediumVelocity, lowVelocity, totalSales } });
  } catch {
    return NextResponse.json({ products: [], summary: { highVelocity: 0, mediumVelocity: 0, lowVelocity: 0, totalSales: 0 } });
  }
}
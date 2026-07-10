import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('products')
      .select(`*, category:category_id (name), location:location_id (section, shelf, warehouse:warehouse_id (name))`)
      .not('expiry_date', 'is', null)
      .eq('is_active', true)
      .order('expiry_date');

    if (error) throw error;

    const today = new Date();
    const products = data.map((product: any) => {
      const expiryDate = new Date(product.expiry_date!);
      const diffTime = expiryDate.getTime() - today.getTime();
      const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      let status: string;
      if (daysLeft < 0) status = 'expired';
      else if (daysLeft <= 30) status = 'danger';
      else if (daysLeft <= 60) status = 'warning';
      else status = 'safe';

      return {
        id: product.id,
        name: product.name,
        barcode: product.barcode,
        category: product.category?.name || '',
        stock: product.current_stock,
        expiryDate: product.expiry_date,
        daysLeft,
        status,
        location: product.location ? `${product.location.warehouse?.name || ''} - رف ${product.location.shelf}` : '-',
      };
    });

    const expiredCount = products.filter(p => p.status === 'expired').length;
    const dangerCount = products.filter(p => p.status === 'danger').length;
    const warningCount = products.filter(p => p.status === 'warning').length;

    return NextResponse.json({ products, summary: { expiredCount, dangerCount, warningCount } });
  } catch (error: any) {
    console.error('Expiry report error:', error.message);
    return NextResponse.json({ products: [], summary: { expiredCount: 0, dangerCount: 0, warningCount: 0 } });
  }
}
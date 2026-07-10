import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // الأوامر المكتملة
    const { count: completedOrders } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed')
      .gte('created_at', weekAgo);

    // الموظف الأكثر إنتاجية
    const { data: topEmployee } = await supabase
      .from('orders')
      .select('user:user_id (full_name)')
      .eq('status', 'completed')
      .gte('created_at', weekAgo);

    const employeeMap: any = {};
    topEmployee?.forEach((o: any) => {
      const name = o.user?.full_name || 'غير معروف';
      employeeMap[name] = (employeeMap[name] || 0) + 1;
    });

    const topEmployeeName = Object.entries(employeeMap).sort((a: any, b: any) => b[1] - a[1])[0]?.[0] || 'لا يوجد';

    // المنتجات الأكثر حركة
    const { data: topProducts } = await supabase
      .from('daily_movements')
      .select('product:product_id (name), quantity')
      .gte('created_at', weekAgo);

    const productMap: any = {};
    topProducts?.forEach((m: any) => {
      const name = m.product?.name || 'غير معروف';
      productMap[name] = (productMap[name] || 0) + m.quantity;
    });

    const topProduct = Object.entries(productMap).sort((a: any, b: any) => b[1] - a[1])[0];

    // المنتجات الراكدة
    const { count: stagnantProducts } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .gte('current_stock', 50);

    const report = {
      period: 'الأسبوع الماضي',
      completedOrders: completedOrders || 0,
      topEmployee: topEmployeeName,
      topProduct: topProduct ? `${topProduct[0]} (${topProduct[1]} وحدة)` : 'لا يوجد',
      stagnantProducts: stagnantProducts || 0,
      suggestions: [] as string[],
    };

    // اقتراحات ذكية
    if ((stagnantProducts || 0) > 20) {
      report.suggestions.push('يوجد عدد كبير من المنتجات الراكدة. ينصح بعمل تخفيضات لتحريك المخزون.');
    }
    if ((completedOrders || 0) < 10) {
      report.suggestions.push('عدد الأوامر المكتملة منخفض هذا الأسبوع. قد تحتاج لمراجعة استراتيجية المبيعات.');
    }

    return NextResponse.json(report);
  } catch (error: any) {
    console.error('Weekly report error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
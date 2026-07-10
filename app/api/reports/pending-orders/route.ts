import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        customer:customer_id (name),
        warehouse:warehouse_id (name),
        order_items (product:product_id (name), quantity)
      `)
      .in('status', ['pending', 'processing'])
      .order('created_at', { ascending: false });

    if (error) throw error;

    const today = new Date();
    
    const pendingOrders = data.map(order => {
      const expectedDate = new Date(order.created_at);
      expectedDate.setDate(expectedDate.getDate() + 3); // نفترض 3 أيام للتسليم
      
      const diffTime = today.getTime() - expectedDate.getTime();
      const delay = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
      
      const diffDays = Math.ceil((expectedDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      const isUrgent = diffDays <= 2 && order.status === 'pending';

      return {
        id: order.id,
        order_number: order.order_number,
        type: order.type,
        typeText: order.type === 'inbound' ? 'أمر استلام' : order.type === 'outbound' ? 'أمر تجهيز' : 'نقل داخلي',
        product_name: order.order_items?.[0]?.product?.name || '',
        quantity: order.order_items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0,
        customer_name: order.customer?.name || '-',
        warehouse_name: order.warehouse?.name || '',
        expected_date: expectedDate.toISOString().split('T')[0],
        delay,
        status: order.status,
        notes: order.notes || '',
        isUrgent,
      };
    });

    const totalPending = pendingOrders.length;
    const delayedOrders = pendingOrders.filter(o => o.delay > 0).length;
    const urgentOrders = pendingOrders.filter(o => o.isUrgent).length;
    const onTime = totalPending - delayedOrders;

    return NextResponse.json({
      orders: pendingOrders,
      summary: { totalPending, delayedOrders, urgentOrders, onTime },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}
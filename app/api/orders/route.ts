import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || '';
    const status = searchParams.get('status') || '';
    const search = searchParams.get('search') || '';

    let query = supabase.from('orders').select(`
      *,
      warehouse:warehouse_id (name),
      customer:customer_id (name),
      user:user_id (full_name),
      order_items (id, quantity, unit_price, total_price, product:product_id (name))
    `).order('created_at', { ascending: false });

    if (type) query = query.eq('type', type);
    if (status) query = query.eq('status', status);
    if (search) query = query.or(`order_number.ilike.%${search}%`);

    const { data, error } = await query;
    if (error) throw error;

    const orders = data.map((order: any) => ({
      ...order,
      warehouse_name: order.warehouse?.name || '',
      customer_name: order.customer?.name || '',
      user_name: order.user?.full_name || '',
      product_name: order.order_items?.[0]?.product?.name || '',
      total_quantity: order.order_items?.reduce((s: number, i: any) => s + i.quantity, 0) || 0,
      items: order.order_items || [],
    }));

    return NextResponse.json(orders);
  } catch (error: any) {
    console.error('GET Error:', error.message);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, warehouse_id, customer_id, notes, items } = body;

    if (!type || !warehouse_id || !items || items.length === 0) {
      return NextResponse.json({ error: 'يرجى ملء الحقول المطلوبة' }, { status: 400 });
    }

    // رقم الأمر
    const prefix = type === 'inbound' ? 'IN' : type === 'outbound' ? 'OUT' : 'TR';
    const date = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const { count } = await supabase.from('orders').select('*', { count: 'exact', head: true });
    const orderNumber = `${prefix}-${date}-${String((count || 0) + 1).padStart(4, '0')}`;

    // المبلغ الإجمالي
    const totalAmount = items.reduce((sum: number, item: any) => sum + (item.quantity * item.unit_price), 0);

    // إنشاء الأمر
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([{ 
        order_number: orderNumber, 
        type, 
        status: 'pending', 
        warehouse_id, 
        customer_id: customer_id || null, 
        total_amount: totalAmount,
        notes: notes || null,
      }])
      .select()
      .single();

    if (orderError) {
      console.error('Order error:', orderError.message);
      return NextResponse.json({ error: orderError.message }, { status: 500 });
    }

    // بنود الأمر
    const validItems = items.filter((i: any) => i.product_id);
    
    if (validItems.length > 0) {
      const orderItems = validItems.map((item: any) => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.quantity * item.unit_price,
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
      if (itemsError) console.error('Items error:', itemsError.message);
    }

    // تحديث المخزون
    for (const item of validItems) {
      const { data: prod } = await supabase.from('products').select('current_stock').eq('id', item.product_id).single();
      const currentStock = prod?.current_stock || 0;

      if (type === 'inbound') {
        await supabase.from('products').update({ current_stock: currentStock + item.quantity }).eq('id', item.product_id);
      } else if (type === 'outbound') {
        await supabase.from('products').update({ current_stock: Math.max(currentStock - item.quantity, 0) }).eq('id', item.product_id);
      }
    }

    // حركات يومية
    if (validItems.length > 0) {
      const movements = validItems.map((item: any) => ({
        product_id: item.product_id,
        type: type === 'inbound' ? 'receive' : type === 'outbound' ? 'dispatch' : 'transfer',
        quantity: item.quantity,
        order_id: order.id,
        notes: `أمر ${type === 'inbound' ? 'استلام' : type === 'outbound' ? 'تجهيز' : 'نقل'} #${orderNumber}`,
      }));

      await supabase.from('daily_movements').insert(movements);
    }

    return NextResponse.json(order, { status: 201 });
  } catch (error: any) {
    console.error('POST Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
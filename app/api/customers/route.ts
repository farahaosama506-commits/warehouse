import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET - جلب جميع العملاء
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || '';
    const search = searchParams.get('search') || '';

    let query = supabase
      .from('customers')
      .select('*')
      .order('name');

    if (type && type !== 'all') {
      if (type === 'both') {
        query = query.eq('type', 'both');
      } else {
        query = query.or(`type.eq.${type},type.eq.both`);
      }
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) throw error;

    // جلب إحصائيات كل عميل
    const customersWithStats = await Promise.all(
      data.map(async (customer) => {
        // عدد الطلبات
        const { count: totalOrders } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('customer_id', customer.id);

        // آخر طلب
        const { data: lastOrder } = await supabase
          .from('orders')
          .select('created_at')
          .eq('customer_id', customer.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        // الرصيد (حساب مبسط)
        const { data: orders } = await supabase
          .from('orders')
          .select('type, total_amount')
          .eq('customer_id', customer.id);

        let balance = 0;
        orders?.forEach(order => {
          if (order.type === 'outbound') {
            balance += order.total_amount; // مدين (علينا)
          } else if (order.type === 'inbound') {
            balance -= order.total_amount; // دائن (لنا)
          }
        });

        return {
          ...customer,
          total_orders: totalOrders || 0,
          last_order: lastOrder?.created_at || null,
          balance: balance,
        };
      })
    );

    return NextResponse.json(customersWithStats);
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json({ error: 'Error fetching customers' }, { status: 500 });
  }
}

// POST - إضافة عميل جديد
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, phone, email, address, type, notes } = body;

    const { data, error } = await supabase
      .from('customers')
      .insert([{ name, phone, email, address, type, notes }])
      .select()
      .single();

    if (error) throw error;

    // تسجيل في سجل التدقيق
    await supabase.from('audit_logs').insert([{
      user_id: body.created_by || 'system',
      action: 'إنشاء عميل',
      entity_type: 'customer',
      entity_id: data.id,
      new_value: data,
      ip_address: '127.0.0.1',
    }]);

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error creating customer:', error);
    return NextResponse.json({ error: 'Error creating customer' }, { status: 500 });
  }
}
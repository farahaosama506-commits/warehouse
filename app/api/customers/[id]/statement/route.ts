import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET - كشف حساب العميل
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // جلب العميل
    const { data: customer } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single();

    // جلب جميع معاملات العميل
    const { data: transactions } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        type,
        total_amount,
        created_at
      `)
      .eq('customer_id', id)
      .order('created_at', { ascending: true });

    // بناء كشف الحساب
    let balance = 0;
    const statement = (transactions || []).map((t) => {
      if (t.type === 'outbound') {
        balance += t.total_amount;
        return {
          id: t.id,
          date: t.created_at,
          description: `أمر تجهيز #${t.order_number}`,
          debit: 0,
          credit: t.total_amount,
          balance: balance,
        };
      } else if (t.type === 'inbound') {
        balance -= t.total_amount;
        return {
          id: t.id,
          date: t.created_at,
          description: `أمر استلام #${t.order_number}`,
          debit: t.total_amount,
          credit: 0,
          balance: balance,
        };
      }
      return null;
    }).filter(Boolean);

    return NextResponse.json({
      customer: customer,
      statement: statement,
      current_balance: balance,
    });
  } catch (error) {
    console.error('Error fetching statement:', error);
    return NextResponse.json({ error: 'Error fetching statement' }, { status: 500 });
  }
}
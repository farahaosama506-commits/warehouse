import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// PUT - تحديث حالة الأمر
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, notes, user_id } = body;

    const { data: oldOrder } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();

    const { data, error } = await supabase
      .from('orders')
      .update({ status, notes, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // تسجيل في سجل التدقيق
    await supabase.from('audit_logs').insert([{
      user_id: user_id || 'system',
      action: 'تحديث حالة الأمر',
      entity_type: 'order',
      entity_id: id,
      old_value: { status: oldOrder?.status },
      new_value: { status },
      ip_address: '127.0.0.1',
    }]);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json({ error: 'Error updating order' }, { status: 500 });
  }
}

// DELETE - حذف أمر
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { error } = await supabase
      .from('orders')
      .update({ status: 'cancelled' })
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ message: 'Order cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling order:', error);
    return NextResponse.json({ error: 'Error cancelling order' }, { status: 500 });
  }
}
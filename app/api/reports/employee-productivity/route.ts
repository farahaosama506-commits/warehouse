import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, full_name, role')
      .in('role', ['warehouse_worker', 'warehouse_supervisor']);

    if (error) throw error;

    const employees = await Promise.all(
      users.map(async (user) => {
        // أوامر مكتملة
        const { count: completedOrders } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'completed')
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

        // أوامر معلقة
        const { count: pendingOrders } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'pending')
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

        // إجمالي الأوامر
        const { count: totalOrders } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

        const total = totalOrders || 0;
        const completed = completedOrders || 0;
        const efficiency = total > 0 ? Math.round((completed / total) * 100) : 0;

        return {
          id: user.id,
          name: user.full_name,
          role: user.role === 'warehouse_supervisor' ? 'مشرف مستودع' : 'عامل مستودع',
          completedOrders: completed,
          pendingOrders: pendingOrders || 0,
          totalOrders: total,
          dailyAverage: total > 0 ? (total / 7).toFixed(1) : '0',
          efficiency,
        };
      })
    );

    return NextResponse.json(employees.sort((a, b) => b.efficiency - a.efficiency));
  } catch (error) {
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}
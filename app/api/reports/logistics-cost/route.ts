import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month';

    // تحديد نطاق التاريخ
    const now = new Date();
    let startDate = new Date();
    
    switch(period) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(now.getMonth() - 1);
    }

    const { data, error } = await supabase
      .from('logistics_costs')
      .select('*')
      .gte('cost_date', startDate.toISOString().split('T')[0])
      .order('cost_date', { ascending: false });

    if (error) throw error;

    // تجميع التكاليف حسب الفئة
    const categoryMap: { [key: string]: { amount: number; items: any[] } } = {
      'نقل': { amount: 0, items: [] },
      'تخزين': { amount: 0, items: [] },
      'استلام': { amount: 0, items: [] },
      'أخرى': { amount: 0, items: [] },
    };

    data?.forEach(cost => {
      if (categoryMap[cost.category]) {
        categoryMap[cost.category].amount += cost.amount;
        categoryMap[cost.category].items.push({
          description: cost.description,
          amount: cost.amount,
        });
      }
    });

    const totalCost = data?.reduce((sum, c) => sum + c.amount, 0) || 0;

    const costs = [
      { 
        category: 'نقل', 
        amount: categoryMap['نقل'].amount, 
        percentage: totalCost > 0 ? Math.round((categoryMap['نقل'].amount / totalCost) * 100) : 0,
        color: '#667eea',
        items: categoryMap['نقل'].items,
      },
      { 
        category: 'تخزين', 
        amount: categoryMap['تخزين'].amount, 
        percentage: totalCost > 0 ? Math.round((categoryMap['تخزين'].amount / totalCost) * 100) : 0,
        color: '#27ae60',
        items: categoryMap['تخزين'].items,
      },
      { 
        category: 'استلام', 
        amount: categoryMap['استلام'].amount, 
        percentage: totalCost > 0 ? Math.round((categoryMap['استلام'].amount / totalCost) * 100) : 0,
        color: '#f39c12',
        items: categoryMap['استلام'].items,
      },
      { 
        category: 'أخرى', 
        amount: categoryMap['أخرى'].amount, 
        percentage: totalCost > 0 ? Math.round((categoryMap['أخرى'].amount / totalCost) * 100) : 0,
        color: '#e74c3c',
        items: categoryMap['أخرى'].items,
      },
    ].filter(c => c.amount > 0);

    return NextResponse.json({ costs, totalCost });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Error fetching logistics costs' }, { status: 500 });
  }
}

// POST - إضافة تكلفة جديدة
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { category, description, amount, cost_date, warehouse_id } = body;

    const { data, error } = await supabase
      .from('logistics_costs')
      .insert([{ category, description, amount, cost_date, warehouse_id }])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Error creating cost' }, { status: 500 });
  }
}
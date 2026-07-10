import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data: warehouses, error } = await supabase
      .from('warehouses')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const warehousesWithStats = await Promise.all(
      warehouses.map(async (warehouse) => {
        // عدد الأقسام
        const { count: sectionsCount } = await supabase
          .from('warehouse_locations')
          .select('section', { count: 'exact', head: true })
          .eq('warehouse_id', warehouse.id);

        // السعة المستخدمة = عدد المنتجات في مواقع هذا المستودع
        const { data: locations } = await supabase
          .from('warehouse_locations')
          .select('id')
          .eq('warehouse_id', warehouse.id);

        const locationIds = locations?.map(loc => loc.id) || [];

        let usedCapacity = 0;

        if (locationIds.length > 0) {
          const { count } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .in('location_id', locationIds)
            .eq('is_active', true);

          usedCapacity = count || 0;
        }

        return {
          ...warehouse,
          sections: sectionsCount || 0,
          used_capacity: usedCapacity,
        };
      })
    );

    return NextResponse.json(warehousesWithStats);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, address, description, storage_type, total_capacity } = body;

    const { data, error } = await supabase
      .from('warehouses')
      .insert([{ name, address, description: description || null, storage_type, total_capacity, is_active: true }])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
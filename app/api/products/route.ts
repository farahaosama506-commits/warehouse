import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const categoryId = searchParams.get('category_id') || '';

    let query = supabase
      .from('products')
      .select(`
        *,
        category:category_id (name),
        unit:unit_id (name, abbreviation),
        location:location_id (
          id, section, shelf, col, cell,
          warehouse:warehouse_id (id, name)
        )
      `)
      .order('created_at', { ascending: false });

    if (search) {
      query = query.or(`name.ilike.%${search}%,barcode.ilike.%${search}%`);
    }

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    const { data, error } = await query;

    if (error) throw error;

    const products = data.map((product: any) => ({
      ...product,
      category_name: product.category?.name || '',
      unit_name: product.unit?.name || '',
      unit_abbreviation: product.unit?.abbreviation || '',
      warehouse_name: product.location?.warehouse?.name || '',
      location_display: product.location 
        ? `${product.location.warehouse?.name || ''} - قسم ${product.location.section} - رف ${product.location.shelf}`
        : '',
    }));

    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const insertData: any = {
      name: body.name,
      barcode: body.barcode,
      min_stock: body.min_stock || 0,
      max_stock: body.max_stock || 100,
      current_stock: body.current_stock || 0,
      purchase_price: body.purchase_price || 0,
      selling_price: body.selling_price || 0,
    };

    if (body.category_id) insertData.category_id = body.category_id;
    if (body.unit_id) insertData.unit_id = body.unit_id;
    if (body.weight) insertData.weight = body.weight;
    if (body.volume) insertData.volume = body.volume;
    if (body.expiry_date) insertData.expiry_date = body.expiry_date;
    if (body.location_id) insertData.location_id = body.location_id;
    if (body.status) insertData.status = body.status;

    const { data, error } = await supabase
      .from('products')
      .insert([insertData])
      .select()
      .single();

    if (error) throw error;

    // تحديث current_occupancy في موقع التخزين
    if (body.location_id) {
      await supabase.rpc('increment_location_occupancy', { loc_id: body.location_id });
    }

    // تسجيل حركة يومية
    await supabase.from('daily_movements').insert([{
      product_id: data.id,
      type: 'receive',
      quantity: body.current_stock || 0,
      user_id: body.user_id || 'system',
      to_location_id: body.location_id || null,
      notes: 'إضافة منتج جديد',
    }]);

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
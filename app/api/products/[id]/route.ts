import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // جلب المنتج القديم
    const { data: oldProduct } = await supabase
      .from('products')
      .select('location_id')
      .eq('id', id)
      .single();

    const updateData: any = {
      name: body.name,
      barcode: body.barcode,
      min_stock: body.min_stock || 0,
      max_stock: body.max_stock || 100,
      purchase_price: body.purchase_price || 0,
      selling_price: body.selling_price || 0,
    };

    if (body.category_id) updateData.category_id = body.category_id;
    if (body.unit_id) updateData.unit_id = body.unit_id;
    if (body.weight) updateData.weight = body.weight;
    if (body.volume) updateData.volume = body.volume;
    if (body.expiry_date) updateData.expiry_date = body.expiry_date;
    if (body.location_id !== undefined) updateData.location_id = body.location_id;
    if (body.status) updateData.status = body.status;
    if (body.current_stock !== undefined) updateData.current_stock = body.current_stock;

    const { data, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // إذا تغير الموقع
    if (body.location_id && oldProduct?.location_id !== body.location_id) {
      if (oldProduct?.location_id) {
        await supabase.rpc('decrement_location_occupancy', { loc_id: oldProduct.location_id });
      }
      await supabase.rpc('increment_location_occupancy', { loc_id: body.location_id });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error updating product:', error);
    return NextResponse.json({ error: error.message || 'Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // جلب المنتج لمعرفة الموقع
    const { data: product } = await supabase
      .from('products')
      .select('location_id')
      .eq('id', id)
      .single();

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) throw error;

    // إنقاص occupancy من الموقع
    if (product?.location_id) {
      await supabase.rpc('decrement_location_occupancy', { loc_id: product.location_id });
    }

    return NextResponse.json({ message: 'Deleted' });
  } catch (error: any) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ error: error.message || 'Error' }, { status: 500 });
  }
}
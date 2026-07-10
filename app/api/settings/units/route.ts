import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('measurement_units')
      .select('*')
      .order('name');

    if (error) throw error;
    return NextResponse.json(data);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, abbreviation, base_unit_id, conversion_factor } = body;

    const { data, error } = await supabase
      .from('measurement_units')
      .insert([{ name, abbreviation, base_unit_id: base_unit_id || null, conversion_factor: conversion_factor || 1 }])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
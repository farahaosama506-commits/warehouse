import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select(`*, user:user_id (full_name)`)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    const logs = data.map((log: any) => ({
      id: log.id,
      user: log.user?.full_name || 'النظام',
      action: log.action,
      entity: log.entity_type,
      entityId: log.entity_id,
      details: log.new_value ? JSON.stringify(log.new_value).substring(0, 100) : '',
      timestamp: new Date(log.created_at).toLocaleString('ar-SA'),
      ip: log.ip_address,
    }));

    return NextResponse.json(logs);
  } catch (error: any) {
    console.error('Audit log error:', error.message);
    return NextResponse.json([]);
  }
}
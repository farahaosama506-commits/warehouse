import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // جلب الإعدادات
    const { data: settingsData } = await supabase.from('settings').select('*');
    const settings: any = {};
    settingsData?.forEach((row: any) => { settings[row.key] = row.value; });

    const notifications: any[] = [];
    const alerts: any[] = [];

    // 1. فحص المخزون المنخفض
    if (settings.enableNotifications === 'true') {
      const lowStockPercent = parseInt(settings.lowStockAlert || '20');
      const { data: lowProducts } = await supabase
        .from('products')
        .select('name, current_stock, min_stock')
        .eq('is_active', true);

      lowProducts?.forEach((product: any) => {
        const percent = (product.current_stock / product.min_stock) * 100;
        if (product.min_stock > 0 && percent <= lowStockPercent) {
          alerts.push({
            type: 'low_stock',
            title: 'تنبيه مخزون منخفض',
            message: `المنتج "${product.name}" مخزونه ${product.current_stock} (${percent.toFixed(0)}% من الحد الأدنى)`,
            severity: percent <= 10 ? 'danger' : 'warning',
          });
        }
      });

      // 2. فحص الصلاحية
      const expiryDays = parseInt(settings.expiryAlertDays || '30');
      const { data: expiringProducts } = await supabase
        .from('products')
        .select('name, expiry_date, current_stock')
        .eq('is_active', true)
        .not('expiry_date', 'is', null);

      expiringProducts?.forEach((product: any) => {
        const daysLeft = Math.ceil((new Date(product.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        if (daysLeft > 0 && daysLeft <= expiryDays) {
          alerts.push({
            type: 'expiry',
            title: 'تنبيه صلاحية',
            message: `المنتج "${product.name}" ستنتهي صلاحيته خلال ${daysLeft} يوم`,
            severity: daysLeft <= 7 ? 'danger' : 'warning',
          });
        }
      });

      notifications.push(...alerts.slice(0, 5)); // أقصى حد 5 إشعارات
    }

    // 3. تحليل السلوك
    if (settings.enableBehaviorAnalysis === 'true') {
      const { data: suspiciousActivities } = await supabase
        .from('audit_logs')
        .select('*')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      // فحص محاولات تسجيل دخول فاشلة
      const loginAttempts = suspiciousActivities?.filter((log: any) =>
        log.action === 'تسجيل دخول'
      ) || [];

      if (loginAttempts.length > 10) {
        notifications.push({
          type: 'behavior',
          title: 'تحليل السلوك',
          message: `تم اكتشاف ${loginAttempts.length} محاولة تسجيل دخول خلال 24 ساعة`,
          severity: 'warning',
        });
      }

      // فحص عمليات حذف جماعية
      const deleteActions = suspiciousActivities?.filter((log: any) =>
        log.action === 'حذف'
      ) || [];

      if (deleteActions.length > 5) {
        notifications.push({
          type: 'behavior',
          title: 'نشاط غير اعتيادي',
          message: `تم اكتشاف ${deleteActions.length} عملية حذف خلال 24 ساعة`,
          severity: 'danger',
        });
      }
    }

    // 4. تحليل الأخطاء
    if (settings.enableErrorDetection === 'true') {
      const { data: errorLogs } = await supabase
        .from('audit_logs')
        .select('*')
        .contains('new_value', { error: true })
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      const errorCount = errorLogs?.length || 0;

      if (errorCount > 10) {
        notifications.push({
          type: 'error',
          title: 'تحليل الأخطاء',
          message: `تم رصد ${errorCount} خطأ في العمليات خلال 24 ساعة. ينصح بمراجعة سجل التدقيق.`,
          severity: 'danger',
        });
      }
    }

    return NextResponse.json({
      notifications,
      alerts,
      totalAlerts: alerts.length,
      behaviorAlerts: notifications.filter(n => n.type === 'behavior').length,
      errorAlerts: notifications.filter(n => n.type === 'error').length,
    });
  } catch (error: any) {
    console.error('Notification check error:', error.message);
    return NextResponse.json({ notifications: [], alerts: [], totalAlerts: 0, behaviorAlerts: 0, errorAlerts: 0 });
  }
}
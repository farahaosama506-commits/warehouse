import { z } from 'zod';

// ==================== المنتجات ====================
export const productSchema = z.object({
  name: z.string().min(2, 'اسم المنتج يجب أن يكون حرفين على الأقل').max(100, 'اسم المنتج طويل جداً'),
  barcode: z.string().min(3, 'الباركود يجب أن يكون 3 أحرف على الأقل').max(50, 'الباركود طويل جداً'),
  category_id: z.string().optional(),
  unit_id: z.string().optional(),
  weight: z.number().positive('الوزن يجب أن يكون أكبر من 0').optional().nullable(),
  volume: z.number().positive('الحجم يجب أن يكون أكبر من 0').optional().nullable(),
  min_stock: z.number().min(0, 'الحد الأدنى يجب أن يكون 0 أو أكثر'),
  max_stock: z.number().min(1, 'الحد الأقصى يجب أن يكون 1 على الأقل'),
  purchase_price: z.number().min(0, 'سعر الشراء يجب أن يكون 0 أو أكثر'),
  selling_price: z.number().min(0, 'سعر البيع يجب أن يكون 0 أو أكثر'),
  expiry_date: z.string().optional().nullable(),
  location_id: z.string().optional().nullable(),
  status: z.string().optional(),
});

export type ProductFormData = z.infer<typeof productSchema>;

// ==================== المستودعات ====================
export const warehouseSchema = z.object({
  name: z.string().min(2, 'اسم المستودع يجب أن يكون حرفين على الأقل').max(100),
  address: z.string().min(5, 'العنوان يجب أن يكون 5 أحرف على الأقل').max(200),
  description: z.string().max(500).optional().nullable(),
  storage_type: z.enum(['refrigerated', 'dry', 'cold', 'hazardous']),
  total_capacity: z.number().positive('السعة يجب أن تكون أكبر من 0'),
});

export type WarehouseFormData = z.infer<typeof warehouseSchema>;

// ==================== مواقع التخزين ====================
export const locationSchema = z.object({
  warehouse_id: z.string().uuid('يجب اختيار مستودع'),
  section: z.string().min(1, 'القسم مطلوب').max(10),
  shelf: z.string().min(1, 'الرف مطلوب').max(10),
  column: z.string().min(1, 'العمود مطلوب').max(10),
  cell: z.string().min(1, 'الخلية مطلوبة').max(10),
  capacity: z.number().positive('السعة يجب أن تكون أكبر من 0'),
  storage_type: z.enum(['refrigerated', 'dry', 'cold', 'hazardous']),
});

export type LocationFormData = z.infer<typeof locationSchema>;

// ==================== الأوامر ====================
export const orderItemSchema = z.object({
  product_id: z.string().uuid('يجب اختيار منتج'),
  quantity: z.number().positive('الكمية يجب أن تكون أكبر من 0'),
  unit_price: z.number().min(0, 'السعر يجب أن يكون 0 أو أكثر'),
});

export const orderSchema = z.object({
  type: z.enum(['inbound', 'outbound', 'transfer']),
  warehouse_id: z.string().uuid('يجب اختيار مستودع'),
  customer_id: z.string().optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
  items: z.array(orderItemSchema).min(1, 'يجب إضافة بند واحد على الأقل'),
});

export type OrderFormData = z.infer<typeof orderSchema>;

// ==================== العملاء ====================
export const customerSchema = z.object({
  name: z.string().min(2, 'الاسم يجب أن يكون حرفين على الأقل').max(100),
  phone: z.string().min(7, 'رقم الهاتف غير صالح').max(20),
  email: z.string().email('بريد إلكتروني غير صالح').optional().or(z.literal('')),
  address: z.string().max(200).optional().or(z.literal('')),
  type: z.enum(['supplier', 'customer', 'both']),
  notes: z.string().max(500).optional().or(z.literal('')),
});

export type CustomerFormData = z.infer<typeof customerSchema>;

// ==================== المستخدمين ====================
export const userSchema = z.object({
  full_name: z.string().min(3, 'الاسم الكامل يجب أن يكون 3 أحرف على الأقل').max(100),
  username: z.string().min(3, 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل').max(50).regex(/^[a-zA-Z0-9_]+$/, 'اسم المستخدم يجب أن يحتوي على أحرف إنجليزية وأرقام فقط'),
  password_hash: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
  phone: z.string().min(7, 'رقم الهاتف غير صالح').max(20),
  role: z.enum(['general_manager', 'warehouse_supervisor', 'warehouse_worker', 'system_admin', 'investor']),
});

export type UserFormData = z.infer<typeof userSchema>;

// ==================== تسجيل الدخول ====================
export const loginSchema = z.object({
  email: z.string().min(1, 'البريد الإلكتروني مطلوب'),
  password: z.string().min(1, 'كلمة المرور مطلوبة'),
});

export type LoginFormData = z.infer<typeof loginSchema>;
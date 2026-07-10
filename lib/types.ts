export type UserRole = 'general_manager' | 'warehouse_supervisor' | 'warehouse_worker' | 'system_admin' | 'investor';

export interface User {
  id: string;
  full_name: string;
  username: string;
  phone: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  barcode: string;
  category_id: string;
  unit_id: string;
  weight: number | null;
  volume: number | null;
  min_stock: number;
  max_stock: number;
  current_stock: number;
  purchase_price: number;
  selling_price: number;
  expiry_date: string | null;
  location_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface MeasurementUnit {
  id: string;
  name: string;
  abbreviation: string;
  base_unit_id: string | null;
  conversion_factor: number;
  created_at: string;
}

export interface Warehouse {
  id: string;
  name: string;
  address: string;
  description: string | null;
  storage_type: 'refrigerated' | 'dry' | 'cold' | 'hazardous';
  total_capacity: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WarehouseLocation {
  id: string;
  warehouse_id: string;
  section: string;
  shelf: string;
  column: string;
  cell: string;
  capacity: number;
  storage_type: 'refrigerated' | 'dry' | 'cold' | 'hazardous';
  created_at: string;
}

export type OrderType = 'inbound' | 'outbound' | 'transfer';
export type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled';

export interface Order {
  id: string;
  order_number: string;
  type: OrderType;
  status: OrderStatus;
  warehouse_id: string;
  customer_id: string | null;
  user_id: string;
  notes: string | null;
  total_amount: number;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  location_id: string | null;
}

export type MovementType = 'receive' | 'dispatch' | 'transfer' | 'return' | 'adjustment';

export interface DailyMovement {
  id: string;
  product_id: string;
  type: MovementType;
  quantity: number;
  from_location_id: string | null;
  to_location_id: string | null;
  user_id: string;
  order_id: string | null;
  notes: string | null;
  created_at: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  type: 'supplier' | 'customer' | 'both';
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  old_value: any;
  new_value: any;
  ip_address: string;
  created_at: string;
}
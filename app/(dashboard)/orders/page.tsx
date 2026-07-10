'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/lib/toast-context';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlus, FaSearch, FaFileAlt, FaTruck, FaExchangeAlt, FaEye, FaEdit, FaTrash, FaBox } from 'react-icons/fa';
import StatusBadge from '@/components/ui/StatusBadge';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

type ActiveTab = 'orders' | 'daily-movements';

interface Order {
  id: string;
  order_number: string;
  type: 'inbound' | 'outbound' | 'transfer';
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  warehouse_name: string;
  customer_name: string;
  user_name: string;
  product_name: string;
  total_quantity: number;
  total_amount: number;
  notes: string | null;
  items: OrderItem[];
  created_at: string;
}

interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface DailyMovement {
  id: string;
  type: 'receive' | 'dispatch' | 'transfer' | 'return' | 'adjustment';
  product_name: string;
  product_barcode: string;
  quantity: number;
  from_location_display: string;
  to_location_display: string;
  user_name: string;
  order_number: string;
  notes: string | null;
  created_at: string;
}

const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('ar-SA');
const formatTime = (dateStr: string) => new Date(dateStr).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
const formatCurrency = (value: number) => `$${value.toLocaleString('en-US')}`;

export default function OrdersPage() {
  const { showToast } = useToast();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<ActiveTab>('orders');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [movements, setMovements] = useState<DailyMovement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [customers, setCustomers] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);

  const [newOrder, setNewOrder] = useState({
    type: 'inbound' as string,
    warehouse_id: '',
    customer_id: '',
    notes: '',
    items: [{ product_id: '', quantity: 1, unit_price: 0 }],
  });

  const fetchOrders = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (filterType) params.append('type', filterType);
      if (filterStatus) params.append('status', filterStatus);
      if (searchTerm) params.append('search', searchTerm);
      const res = await fetch(`/api/orders?${params.toString()}`);
      setOrders(await res.json());
    } catch {} finally { setIsLoading(false); }
  }, [filterType, filterStatus, searchTerm]);

  const fetchMovements = useCallback(async () => {
    try { const res = await fetch('/api/daily-movements'); setMovements(await res.json()); } catch {}
  }, []);

  const fetchCustomers = async () => {
    try { const res = await fetch('/api/customers'); setCustomers(await res.json()); } catch {}
  };

  const fetchWarehouses = async () => {
    try { const res = await fetch('/api/warehouses'); setWarehouses(await res.json()); } catch {}
  };

  const fetchProducts = async () => {
    try { const res = await fetch('/api/products'); setProducts(await res.json()); } catch {}
  };

  useEffect(() => { fetchOrders(); fetchMovements(); fetchCustomers(); fetchWarehouses(); fetchProducts(); }, [fetchOrders, fetchMovements]);

  // فتح Modal تلقائياً إذا في type بالـ URL
  useEffect(() => {
    const typeParam = searchParams.get('type');
    if (typeParam === 'inbound' || typeParam === 'outbound') {
      setNewOrder(prev => ({ ...prev, type: typeParam }));
      setShowAddModal(true);
    }
  }, [searchParams]);
        const handleCreateOrder = async () => {
            if (!newOrder.warehouse_id || newOrder.items.some((i: any) => !i.product_id)) {
              showToast('يرجى ملء الحقول المطلوبة', 'info'); return;
            }
            try {
              const payload = {
                type: newOrder.type,
                warehouse_id: newOrder.warehouse_id,
                customer_id: newOrder.customer_id || null,
                notes: newOrder.notes || null,
                items: newOrder.items.filter((i: any) => i.product_id),
              };

              const res = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
              });
              if (res.ok) {
                setShowAddModal(false); fetchOrders(); fetchMovements();
                showToast('تم إنشاء الأمر بنجاح', 'success');
                setNewOrder({ type: 'inbound', warehouse_id: '', customer_id: '', notes: '', items: [{ product_id: '', quantity: 1, unit_price: 0 }] });
              } else { const err = await res.json(); showToast(err.error || 'حدث خطأ', 'error'); }
            } catch { showToast('حدث خطأ', 'error'); }
          };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      await fetch(`/api/orders/${orderId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, user_id: 'system' }),
      });
      fetchOrders(); fetchMovements();
      showToast('تم تحديث الحالة بنجاح', 'success');
    } catch { showToast('حدث خطأ', 'error'); }
  };

  const handleCancelOrder = (id: string) => setConfirmCancelId(id);

  const confirmCancelOrder = async () => {
    if (!confirmCancelId) return;
    try {
      await fetch(`/api/orders/${confirmCancelId}`, { method: 'DELETE' });
      fetchOrders(); fetchMovements();
      showToast('تم إلغاء الأمر بنجاح', 'success');
    } catch { showToast('حدث خطأ', 'error'); }
    setConfirmCancelId(null);
  };

  const getTypeBadge = (type: string) => {
    const m: any = { inbound: { text: 'استلام', class: 'bg-success' }, outbound: { text: 'تجهيز', class: 'bg-primary' }, transfer: { text: 'نقل داخلي', class: 'bg-info' } };
    const c = m[type] || { text: type, class: 'bg-secondary' };
    return <span className={`badge ${c.class}`}>{c.text}</span>;
  };

  const getMovementTypeBadge = (type: string) => {
    const m: any = { receive: { text: 'استلام', class: 'bg-success' }, dispatch: { text: 'تجهيز', class: 'bg-primary' }, transfer: { text: 'نقل', class: 'bg-info' }, return: { text: 'مرتجع', class: 'bg-warning text-dark' }, adjustment: { text: 'جرد', class: 'bg-secondary' } };
    const c = m[type] || { text: type, class: 'bg-secondary' };
    return <span className={`badge ${c.class}`}>{c.text}</span>;
  };

  const getStatusText = (status: string) => ({ pending: 'معلق', processing: 'قيد التنفيذ', completed: 'مكتمل', cancelled: 'ملغي' } as any)[status] || status;

  if (isLoading) return <div className="text-center py-5"><div className="spinner-border text-primary" /><p className="mt-2 text-muted">جاري تحميل البيانات...</p></div>;

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="d-flex justify-content-between align-items-center mb-4">
        <div><h2 className="fw-bold mb-1" style={{ color: '#0f172a' }}>الأوامر والحركات</h2><p className="text-muted mb-0" style={{ fontSize: 14 }}>إدارة أوامر الاستلام والتجهيز والنقل الداخلي</p></div>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="btn btn-primary d-flex align-items-center gap-2" style={{ borderRadius: 10, padding: '10px 20px' }} onClick={() => setShowAddModal(true)}><FaPlus /> أمر جديد</motion.button>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-4">
        <div style={{ display: 'flex', gap: 4, backgroundColor: '#f1f5f9', padding: 4, borderRadius: 12, width: 'fit-content' }}>
          {[{ id: 'orders', icon: <FaFileAlt size={14} />, label: 'الأوامر' }, { id: 'daily-movements', icon: <FaExchangeAlt size={14} />, label: 'الحركات اليومية' }].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as ActiveTab)} style={{ padding: '10px 24px', border: 'none', borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: 'pointer', transition: 'all 0.2s', backgroundColor: activeTab === tab.id ? 'white' : 'transparent', color: activeTab === tab.id ? '#444ce7' : '#475569', boxShadow: activeTab === tab.id ? '0 2px 8px rgba(0,0,0,0.1)' : 'none', display: 'flex', alignItems: 'center', gap: 8 }}>{tab.icon} {tab.label}</button>
          ))}
        </div>
      </motion.div>

      {activeTab === 'orders' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card mb-4" style={{ borderRadius: 16 }}>
          <div className="card-body p-3">
            <div className="row g-3 align-items-center">
              <div className="col-md-4"><div style={{ position: 'relative' }}><FaSearch style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} /><input type="text" className="form-control" placeholder="بحث برقم الأمر..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ padding: '10px 40px 10px 16px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 14 }} /></div></div>
              <div className="col-md-3"><select className="form-select" value={filterType} onChange={e => setFilterType(e.target.value)} style={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 14, padding: '10px 16px' }}><option value="">جميع الأنواع</option><option value="inbound">استلام</option><option value="outbound">تجهيز</option><option value="transfer">نقل داخلي</option></select></div>
              <div className="col-md-3"><select className="form-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 14, padding: '10px 16px' }}><option value="">جميع الحالات</option><option value="pending">معلق</option><option value="processing">قيد التنفيذ</option><option value="completed">مكتمل</option><option value="cancelled">ملغي</option></select></div>
              <div className="col-md-2 text-end"><span className="text-muted" style={{ fontSize: 14 }}>عدد الأوامر: <strong>{orders.length}</strong></span></div>
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === 'orders' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card" style={{ borderRadius: 16, overflow: 'hidden' }}>
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead><tr style={{ backgroundColor: '#f8fafc', fontSize: 12 }}>{['رقم الأمر','النوع','المستودع','العميل/المورد','المنتج','الكمية','المبلغ','المنشئ','التاريخ','الحالة','إجراءات'].map(h => <th key={h} className="px-4 py-3">{h}</th>)}</tr></thead>
              <tbody>
                {orders.length === 0 ? <tr><td colSpan={11} className="text-center py-4 text-muted"><FaBox size={48} style={{ color: '#cbd5e1' }} /><p className="mt-2">لا توجد أوامر</p></td></tr> :
                  orders.map((order, index) => (
                    <motion.tr key={order.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ delay: index * 0.05 }} style={{ cursor: 'pointer' }} onClick={() => { setSelectedOrder(order); setShowViewModal(true); }}>
                      <td className="px-4 py-3 fw-semibold" style={{ color: '#444ce7' }}>{order.order_number}</td>
                      <td className="px-4 py-3">{getTypeBadge(order.type)}</td>
                      <td className="px-4 py-3">{order.warehouse_name}</td>
                      <td className="px-4 py-3">{order.customer_name || '-'}</td>
                      <td className="px-4 py-3 fw-semibold">{order.product_name}</td>
                      <td className="px-4 py-3 fw-bold">{order.total_quantity}</td>
                      <td className="px-4 py-3 fw-semibold">{formatCurrency(order.total_amount)}</td>
                      <td className="px-4 py-3">{order.user_name}</td>
                      <td className="px-4 py-3 text-muted">{formatDate(order.created_at)}</td>
                      <td className="px-4 py-3"><StatusBadge status={order.status} text={getStatusText(order.status)} /></td>
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <div className="d-flex gap-1">
                          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="btn btn-sm btn-outline-info" style={{ borderRadius: 8 }} title="عرض" onClick={() => { setSelectedOrder(order); setShowViewModal(true); }}><FaEye size={14} /></motion.button>
                          {order.status === 'pending' && <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="btn btn-sm btn-outline-success" style={{ borderRadius: 8 }} title="بدء التنفيذ" onClick={() => handleUpdateStatus(order.id, 'processing')}><FaTruck size={14} /></motion.button>}
                          {order.status === 'processing' && <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="btn btn-sm btn-outline-success" style={{ borderRadius: 8 }} title="إكمال" onClick={() => handleUpdateStatus(order.id, 'completed')}><FaEdit size={14} /></motion.button>}
                          {order.status !== 'completed' && order.status !== 'cancelled' && <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="btn btn-sm btn-outline-danger" style={{ borderRadius: 8 }} title="إلغاء" onClick={() => handleCancelOrder(order.id)}><FaTrash size={14} /></motion.button>}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {activeTab === 'daily-movements' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card" style={{ borderRadius: 16, overflow: 'hidden' }}>
          <div className="card-header bg-white border-0 pt-4 px-4"><h5 className="fw-bold mb-0">سجل الحركات اليومية</h5></div>
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead><tr style={{ backgroundColor: '#f8fafc', fontSize: 12 }}>{['النوع','المنتج','الكمية','من','إلى','الأمر','المستخدم','التاريخ','الوقت'].map(h => <th key={h} className="px-4 py-3">{h}</th>)}</tr></thead>
              <tbody>
                {movements.length === 0 ? <tr><td colSpan={9} className="text-center py-4 text-muted">لا توجد حركات</td></tr> :
                  movements.map((movement, index) => (
                    <motion.tr key={movement.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                      <td className="px-4 py-3">{getMovementTypeBadge(movement.type)}</td>
                      <td className="px-4 py-3 fw-semibold">{movement.product_name}</td>
                      <td className="px-4 py-3 fw-bold">{movement.quantity}</td>
                      <td className="px-4 py-3 text-muted" style={{ fontSize: 13 }}>{movement.from_location_display || '-'}</td>
                      <td className="px-4 py-3 text-muted" style={{ fontSize: 13 }}>{movement.to_location_display || '-'}</td>
                      <td className="px-4 py-3">{movement.order_number || '-'}</td>
                      <td className="px-4 py-3">{movement.user_name}</td>
                      <td className="px-4 py-3 text-muted" style={{ fontSize: 13 }}>{formatDate(movement.created_at)}</td>
                      <td className="px-4 py-3"><span className="badge bg-light text-dark">{formatTime(movement.created_at)}</span></td>
                    </motion.tr>
                  ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      <Modal isOpen={showViewModal} onClose={() => setShowViewModal(false)} title={`تفاصيل الأمر ${selectedOrder?.order_number}`} size="lg">
        {selectedOrder && (
          <div>
            <div className="row mb-3">
              <div className="col-md-4"><small className="text-muted">النوع</small><p>{getTypeBadge(selectedOrder.type)}</p></div>
              <div className="col-md-4"><small className="text-muted">الحالة</small><p><StatusBadge status={selectedOrder.status} text={getStatusText(selectedOrder.status)} /></p></div>
              <div className="col-md-4"><small className="text-muted">التاريخ</small><p className="fw-semibold">{formatDate(selectedOrder.created_at)}</p></div>
            </div>
            <div className="row mb-3">
              <div className="col-md-4"><small className="text-muted">المستودع</small><p className="fw-semibold">{selectedOrder.warehouse_name}</p></div>
              <div className="col-md-4"><small className="text-muted">العميل/المورد</small><p className="fw-semibold">{selectedOrder.customer_name || '-'}</p></div>
              <div className="col-md-4"><small className="text-muted">المنشئ</small><p className="fw-semibold">{selectedOrder.user_name}</p></div>
            </div>
            {selectedOrder.notes && <div className="mb-3"><small className="text-muted">ملاحظات</small><p>{selectedOrder.notes}</p></div>}
            <h6 className="fw-bold mb-3">بنود الأمر</h6>
            <table className="table table-bordered">
              <thead><tr style={{ backgroundColor: '#f8fafc' }}><th>المنتج</th><th>الكمية</th><th>سعر الوحدة</th><th>الإجمالي</th></tr></thead>
              <tbody>{selectedOrder.items?.map((item, i) => <tr key={i}><td>{item.product_name}</td><td>{item.quantity}</td><td>{formatCurrency(item.unit_price)}</td><td>{formatCurrency(item.total_price)}</td></tr>)}</tbody>
              <tfoot><tr><td colSpan={3} className="text-end fw-bold">المجموع الكلي</td><td className="fw-bold">{formatCurrency(selectedOrder.total_amount)}</td></tr></tfoot>
            </table>
          </div>
        )}
      </Modal>

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="إنشاء أمر جديد" size="lg"
        footer={<div className="d-flex justify-content-end gap-2"><button className="btn btn-secondary" onClick={() => setShowAddModal(false)} style={{ borderRadius: 10 }}>إلغاء</button><button className="btn btn-primary" onClick={handleCreateOrder} style={{ borderRadius: 10 }}>حفظ الأمر</button></div>}>
        <div className="row">
          <div className="col-md-4 mb-3"><label className="form-label fw-semibold">نوع الأمر</label><select className="form-select" value={newOrder.type} onChange={e => setNewOrder({ ...newOrder, type: e.target.value })} style={{ borderRadius: 10 }}><option value="inbound">أمر استلام</option><option value="outbound">أمر تجهيز</option><option value="transfer">نقل داخلي</option></select></div>
          <div className="col-md-4 mb-3"><label className="form-label fw-semibold">المستودع <span className="text-danger">*</span></label><select className="form-select" value={newOrder.warehouse_id} onChange={e => setNewOrder({ ...newOrder, warehouse_id: e.target.value })} style={{ borderRadius: 10 }}><option value="">اختر المستودع</option>{warehouses.map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}</select></div>
          <div className="col-md-4 mb-3"><label className="form-label fw-semibold">العميل/المورد</label><select className="form-select" value={newOrder.customer_id} onChange={e => setNewOrder({ ...newOrder, customer_id: e.target.value })} style={{ borderRadius: 10 }}><option value="">اختر</option>{customers.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          <div className="col-12 mb-3"><label className="form-label fw-semibold">ملاحظات</label><textarea className="form-control" rows={2} value={newOrder.notes} onChange={e => setNewOrder({ ...newOrder, notes: e.target.value })} style={{ borderRadius: 10 }} /></div>
          <div className="col-12">
            <h6 className="fw-bold mb-3">بنود الأمر</h6>
            {newOrder.items.map((item: any, index: number) => (
              <div key={index} className="row g-2 mb-2 align-items-end">
                <div className="col-md-5">
                  <select className="form-select" value={item.product_id} onChange={e => { const ni = [...newOrder.items]; ni[index].product_id = e.target.value; setNewOrder({ ...newOrder, items: ni }); }} style={{ borderRadius: 8, fontSize: 14 }}>
                    <option value="">اختر المنتج</option>
                    {products.map((p: any) => <option key={p.id} value={p.id}>{p.name} (المخزون: {p.current_stock})</option>)}
                  </select>
                </div>
                <div className="col-md-2"><input type="number" className="form-control" value={item.quantity} min={1} onChange={e => { const ni = [...newOrder.items]; ni[index].quantity = +e.target.value; setNewOrder({ ...newOrder, items: ni }); }} style={{ borderRadius: 8 }} /></div>
                <div className="col-md-3"><input type="number" className="form-control" value={item.unit_price} min={0} onChange={e => { const ni = [...newOrder.items]; ni[index].unit_price = +e.target.value; setNewOrder({ ...newOrder, items: ni }); }} style={{ borderRadius: 8 }} /></div>
                <div className="col-md-2"><button className="btn btn-sm btn-outline-danger w-100" style={{ borderRadius: 8 }} onClick={() => { if (newOrder.items.length > 1) setNewOrder({ ...newOrder, items: newOrder.items.filter((_, i) => i !== index) }); }}><FaTrash size={12} /></button></div>
              </div>
            ))}
            <button className="btn btn-sm btn-outline-primary mt-2" style={{ borderRadius: 8 }} onClick={() => setNewOrder({ ...newOrder, items: [...newOrder.items, { product_id: '', quantity: 1, unit_price: 0 }] })}><FaPlus size={12} className="me-1" /> إضافة بند</button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog isOpen={!!confirmCancelId} onClose={() => setConfirmCancelId(null)} onConfirm={confirmCancelOrder} title="إلغاء الأمر" message="هل أنت متأكد من إلغاء هذا الأمر؟" confirmText="إلغاء الأمر" type="danger" />
    </div>
  );
}
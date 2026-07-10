'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/lib/toast-context';
import { motion, AnimatePresence } from 'framer-motion';
import { productSchema } from '@/lib/validations';
import { getValidationErrors } from '@/lib/utils';
import { 
  FaPlus, FaEdit, FaTrash, FaSearch, FaBarcode, FaBox
} from 'react-icons/fa';
import StatusBadge from '@/components/ui/StatusBadge';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

interface Product {
  id: string;
  name: string;
  barcode: string;
  category_id: string;
  category_name: string;
  unit_id: string;
  unit_name: string;
  unit_abbreviation: string;
  weight: number | null;
  volume: number | null;
  min_stock: number;
  max_stock: number;
  current_stock: number;
  purchase_price: number;
  selling_price: number;
  expiry_date: string | null;
  location_id: string | null;
  location_display: string;
  warehouse_name?: string;
  warehouse_id?: string;
  status?: string;
  is_active: boolean;
}

interface Category {
  id: string;
  name: string;
}

interface MeasurementUnit {
  id: string;
  name: string;
  abbreviation: string;
}

const EMPTY_PRODUCT: Product = {
  id: '', name: '', barcode: '', category_id: '', category_name: '',
  unit_id: '', unit_name: '', unit_abbreviation: '', weight: null, volume: null,
  min_stock: 0, max_stock: 100, current_stock: 0, purchase_price: 0, selling_price: 0,
  expiry_date: null, location_id: null, location_display: '', warehouse_id: '', status: 'active', is_active: true,
};

const getStatusText = (product: Product) => {
  if (product.status === 'inactive') return { text: 'غير نشط', status: 'cancelled' as const };
  if (product.status === 'out_of_stock') return { text: 'نافذ المخزون', status: 'cancelled' as const };
  if (product.status === 'discontinued') return { text: 'متوقف', status: 'pending' as const };
  if (product.current_stock === 0) return { text: 'نفذ', status: 'cancelled' as const };
  if (product.current_stock <= product.min_stock) return { text: 'منخفض', status: 'pending' as const };
  if (product.current_stock >= product.max_stock) return { text: 'زائد', status: 'shipped' as const };
  return { text: 'طبيعي', status: 'completed' as const };
};

export default function ProductsPage() {
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [units, setUnits] = useState<MeasurementUnit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const fetchProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedCategory) params.append('category_id', selectedCategory);
      const res = await fetch(`/api/products?${params.toString()}`);
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch { setProducts([]); } finally { setIsLoading(false); }
  }, [searchTerm, selectedCategory]);

  const fetchCategories = useCallback(async () => {
    try { const res = await fetch('/api/categories'); setCategories(await res.json()); } catch {}
  }, []);

  const fetchUnits = useCallback(async () => {
    try { const res = await fetch('/api/measurement-units'); setUnits(await res.json()); } catch {}
  }, []);

 const fetchWarehouses = async () => {
  try {
    const res = await fetch('/api/warehouses');
    const data = await res.json();
    setWarehouses(Array.isArray(data) ? data : []);
  } catch {
    setWarehouses([]);
  }
};
  const fetchLocations = async (warehouseId?: string) => {
    try {
      const url = warehouseId ? `/api/warehouse-locations?warehouse_id=${warehouseId}` : '/api/warehouse-locations';
      const res = await fetch(url);
      const data = await res.json();
      setLocations(Array.isArray(data) ? data : []);
    } catch { setLocations([]); }
  };

  useEffect(() => { fetchProducts(); fetchCategories(); fetchUnits(); fetchWarehouses(); fetchLocations(); }, [fetchProducts, fetchCategories, fetchUnits]);

  const handleSaveProduct = async () => {
  if (!selectedProduct) return;

  // التحقق من البيانات
  const result = productSchema.safeParse(selectedProduct);
  
  if (!result.success) {
    const errors = getValidationErrors(result.error);
    const firstError = Object.values(errors)[0];
    showToast(firstError || 'يرجى تصحيح الأخطاء', 'info');
    return;
  }

  try {
    const isEdit = !!selectedProduct.id;
    const res = await fetch(`/api/products${isEdit ? `/${selectedProduct.id}` : ''}`, {
      method: isEdit ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result.data),
    });
    if (res.ok) {
      fetchProducts();
      setShowAddModal(false);
      setSelectedProduct(null);
      showToast(isEdit ? 'تم تعديل المنتج بنجاح' : 'تم إضافة المنتج بنجاح', 'success');
    } else {
      const err = await res.json();
      showToast(err.error || 'حدث خطأ', 'error');
    }
  } catch {
    showToast('حدث خطأ', 'error');
  }
};

const handleDeleteProduct = (id: string) => setConfirmDeleteId(id);

const confirmDeleteProduct = async () => {
  if (!confirmDeleteId) return;
  try {
    const res = await fetch(`/api/products/${confirmDeleteId}`, { method: 'DELETE' });
    if (res.ok) {
      fetchProducts();
      showToast('تم حذف المنتج بنجاح', 'success');
    } else {
      showToast('حدث خطأ', 'error');
    }
  } catch {
    showToast('حدث خطأ', 'error');
  }
  setConfirmDeleteId(null);
};

  const isExpired = (date: string | null) => date ? new Date(date) < new Date() : false;

  if (isLoading && products.length === 0) return (
    <div className="text-center py-5"><div className="spinner-border text-primary" /><p className="mt-2 text-muted">جاري تحميل المنتجات...</p></div>
  );

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="d-flex justify-content-between align-items-center mb-4">
        <div><h2 className="fw-bold mb-1" style={{ color: '#0f172a' }}>دليل المواد</h2><p className="text-muted mb-0" style={{ fontSize: 14 }}>إدارة المنتجات والمخزون</p></div>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="btn btn-primary d-flex align-items-center gap-2" style={{ borderRadius: 10, padding: '10px 20px' }}
          onClick={() => { setSelectedProduct({ ...EMPTY_PRODUCT }); setShowAddModal(true); }}>
          <FaPlus /> إضافة منتج جديد
        </motion.button>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card mb-4" style={{ borderRadius: 16 }}>
        <div className="card-body p-3">
          <div className="row g-3 align-items-center">
            <div className="col-md-5">
              <div style={{ position: 'relative' }}>
                <FaSearch style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input type="text" className="form-control" placeholder="بحث بالاسم أو الباركود..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                  style={{ padding: '10px 40px 10px 16px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 14 }} />
              </div>
            </div>
            <div className="col-md-3">
              <select className="form-select" value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} style={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 14, padding: '10px 16px' }}>
                <option value="">جميع الفئات</option>
                {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </select>
            </div>
            <div className="col-md-4 text-end"><span className="text-muted" style={{ fontSize: 14 }}>عدد المنتجات: <strong>{products.length}</strong></span></div>
          </div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card" style={{ borderRadius: 16, overflow: 'hidden' }}>
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead><tr style={{ backgroundColor: '#f8fafc', fontSize: 12 }}>
              {['#','الباركود','اسم المنتج','الفئة','المخزون','الحد الأدنى','السعر','الوحدة','تاريخ الصلاحية','الموقع','الحالة','إجراءات'].map(h => <th key={h} className="px-4 py-3">{h}</th>)}
            </tr></thead>
            <tbody>
              {products.length === 0 ? (
                <tr><td colSpan={12} className="text-center py-4 text-muted"><FaBox size={48} style={{ color: '#cbd5e1' }} /><p className="mt-2">لا توجد منتجات</p></td></tr>
              ) : products.map((product, index) => {
                const st = getStatusText(product);
                const expired = isExpired(product.expiry_date);
                return (
                  <motion.tr key={product.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ delay: index * 0.05 }}
                    style={{ backgroundColor: product.current_stock === 0 ? '#fef2f2' : 'transparent' }}>
                    <td className="px-4 py-3 fw-semibold">{index + 1}</td>
                    <td className="px-4 py-3"><FaBarcode style={{ color: '#94a3b8', fontSize: 14 }} className="me-2" /><code style={{ fontSize: 12 }}>{product.barcode}</code></td>
                    <td className="px-4 py-3 fw-semibold">{product.name}</td>
                    <td className="px-4 py-3"><span className="badge bg-light text-dark">{product.category_name}</span></td>
                    <td className="px-4 py-3"><span className="fw-bold" style={{ fontSize: 16, color: product.current_stock === 0 ? '#ef4444' : product.current_stock <= product.min_stock ? '#f59e0b' : '#10b981' }}>{product.current_stock}</span></td>
                    <td className="px-4 py-3 text-muted">{product.min_stock}</td>
                    <td className="px-4 py-3 fw-semibold">${product.selling_price || product.purchase_price}</td>
                    <td className="px-4 py-3"><span className="badge bg-light text-dark">{product.unit_abbreviation}</span></td>
                    <td className="px-4 py-3"><span style={{ color: expired ? '#ef4444' : '#475569', fontSize: 13, fontWeight: expired ? 'bold' : 'normal' }}>{product.expiry_date || '-'}{expired && <span className="badge bg-danger ms-2">منتهي</span>}</span></td>
                    <td className="px-4 py-3"><small style={{ color: '#64748b' }}>{product.location_display || '-'}</small></td>
                    <td className="px-4 py-3"><StatusBadge status={st.status} text={st.text} /></td>
                    <td className="px-4 py-3">
                      <div className="d-flex gap-1">
                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="btn btn-sm btn-outline-primary" style={{ borderRadius: 8 }} title="تعديل"
                          onClick={() => { setSelectedProduct(product); fetchLocations(product.warehouse_id); setShowAddModal(true); }}><FaEdit size={14} /></motion.button>
                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="btn btn-sm btn-outline-danger" style={{ borderRadius: 8 }} title="حذف"
                          onClick={() => handleDeleteProduct(product.id)}><FaTrash size={14} /></motion.button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>

      <Modal isOpen={showAddModal} onClose={() => { setShowAddModal(false); setSelectedProduct(null); }}
        title={selectedProduct?.id ? 'تعديل منتج' : 'إضافة منتج جديد'} size="lg"
        footer={<div className="d-flex justify-content-end gap-2">
          <button className="btn btn-secondary" onClick={() => { setShowAddModal(false); setSelectedProduct(null); }} style={{ borderRadius: 10 }}>إلغاء</button>
          <button className="btn btn-primary" style={{ borderRadius: 10 }} onClick={handleSaveProduct}>{selectedProduct?.id ? 'حفظ' : 'إضافة'}</button>
        </div>}>
        <div className="row">
          <div className="col-md-6 mb-3"><label className="form-label fw-semibold">اسم المنتج <span className="text-danger">*</span></label><input type="text" className="form-control" value={selectedProduct?.name || ''} onChange={e => setSelectedProduct(p => p ? { ...p, name: e.target.value } : null)} style={{ borderRadius: 10 }} /></div>
          <div className="col-md-6 mb-3"><label className="form-label fw-semibold">الباركود <span className="text-danger">*</span></label><input type="text" className="form-control" value={selectedProduct?.barcode || ''} onChange={e => setSelectedProduct(p => p ? { ...p, barcode: e.target.value } : null)} style={{ borderRadius: 10 }} /></div>
          <div className="col-md-6 mb-3"><label className="form-label fw-semibold">الفئة</label><select className="form-select" value={selectedProduct?.category_id || ''} onChange={e => setSelectedProduct(p => p ? { ...p, category_id: e.target.value } : null)} style={{ borderRadius: 10 }}><option value="">اختر الفئة</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          <div className="col-md-6 mb-3"><label className="form-label fw-semibold">وحدة القياس</label><select className="form-select" value={selectedProduct?.unit_id || ''} onChange={e => setSelectedProduct(p => p ? { ...p, unit_id: e.target.value } : null)} style={{ borderRadius: 10 }}><option value="">اختر الوحدة</option>{units.map(u => <option key={u.id} value={u.id}>{u.name} ({u.abbreviation})</option>)}</select></div>
          <div className="col-md-6 mb-3"><label className="form-label fw-semibold">المستودع</label><select className="form-select" value={selectedProduct?.warehouse_id || ''} onChange={e => { const wid = e.target.value; setSelectedProduct(p => p ? { ...p, warehouse_id: wid, location_id: '' } : null); if (wid) fetchLocations(wid); }} style={{ borderRadius: 10 }}><option value="">اختر المستودع</option>{warehouses.filter(w => w.is_active).map(w => <option key={w.id} value={w.id}>{w.name}</option>)}</select></div>
          <div className="col-md-6 mb-3"><label className="form-label fw-semibold">موقع التخزين</label><select className="form-select" value={selectedProduct?.location_id || ''} onChange={e => setSelectedProduct(p => p ? { ...p, location_id: e.target.value } : null)} style={{ borderRadius: 10 }} disabled={!selectedProduct?.warehouse_id}><option value="">اختر الموقع</option>{locations.filter((loc: any) => loc.warehouse_id === selectedProduct?.warehouse_id).map((loc: any) => <option key={loc.id} value={loc.id}>قسم {loc.section} - رف {loc.shelf} - عمود {loc.column} - خلية {loc.cell}</option>)}</select></div>
          <div className="col-md-3 mb-3"><label className="form-label fw-semibold">الوزن</label><input type="number" className="form-control" value={selectedProduct?.weight || ''} onChange={e => setSelectedProduct(p => p ? { ...p, weight: e.target.value ? +e.target.value : null } : null)} style={{ borderRadius: 10 }} /></div>
          <div className="col-md-3 mb-3"><label className="form-label fw-semibold">الحد الأدنى <span className="text-danger">*</span></label><input type="number" className="form-control" value={selectedProduct?.min_stock || 0} onChange={e => setSelectedProduct(p => p ? { ...p, min_stock: +e.target.value } : null)} style={{ borderRadius: 10 }} /></div>
          <div className="col-md-3 mb-3"><label className="form-label fw-semibold">الحد الأقصى</label><input type="number" className="form-control" value={selectedProduct?.max_stock || 100} onChange={e => setSelectedProduct(p => p ? { ...p, max_stock: +e.target.value } : null)} style={{ borderRadius: 10 }} /></div>
          <div className="col-md-3 mb-3"><label className="form-label fw-semibold">سعر الشراء</label><input type="number" className="form-control" value={selectedProduct?.purchase_price || 0} onChange={e => setSelectedProduct(p => p ? { ...p, purchase_price: +e.target.value } : null)} style={{ borderRadius: 10 }} /></div>
          <div className="col-md-6 mb-3"><label className="form-label fw-semibold">الحالة</label><select className="form-select" value={selectedProduct?.status || 'active'} onChange={e => setSelectedProduct(p => p ? { ...p, status: e.target.value } : null)} style={{ borderRadius: 10 }}><option value="active">حسب المخزون</option><option value="inactive">غير نشط</option><option value="out_of_stock">نافذ المخزون</option><option value="discontinued">متوقف</option></select></div>
          <div className="col-md-6 mb-3"><label className="form-label fw-semibold">تاريخ الصلاحية</label><input type="date" className="form-control" value={selectedProduct?.expiry_date || ''} onChange={e => setSelectedProduct(p => p ? { ...p, expiry_date: e.target.value || null } : null)} style={{ borderRadius: 10 }} /></div>
        </div>
      </Modal>
      <ConfirmDialog
  isOpen={!!confirmDeleteId}
  onClose={() => setConfirmDeleteId(null)}
  onConfirm={confirmDeleteProduct}
  title="حذف المنتج"
  message="هل أنت متأكد من حذف هذا المنتج؟ لا يمكن التراجع عن هذا الإجراء."
  confirmText="حذف"
  type="danger"
/>
    </div>
  );
}
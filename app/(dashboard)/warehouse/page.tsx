'use client';

import { useState, useEffect, useCallback, ReactNode } from 'react';
import { useToast } from '@/lib/toast-context';
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { 
  FaPlus, FaEdit, FaTrash, FaSearch, FaWarehouse,
  FaSnowflake, FaSun, FaBox, FaMapMarkerAlt, FaCubes,
  FaChevronDown, FaChevronLeft,
} from 'react-icons/fa';
import StatusBadge from '@/components/ui/StatusBadge';
import Modal from '@/components/ui/Modal';



type StorageType = 'refrigerated' | 'dry' | 'cold' | 'hazardous';
type ActiveTab = 'warehouses' | 'locations';

interface Warehouse {
  id: string;
  name: string;
  address: string;
  description: string | null;
  storage_type: StorageType;
  total_capacity: number;
  used_capacity: number;
  sections: number;
  is_active: boolean;
  created_at: string;
}

interface WarehouseLocation {
  id: string;
  warehouse_id: string;
  warehouse_name: string;
  section: string;
  shelf: string;
  column: string;
  cell: string;
  capacity: number;
  current_occupancy: number;
  storage_type: StorageType;
  created_at: string;
}

const STORAGE_TYPES: Record<StorageType, { text: string; icon: ReactNode; class: string }> = {
  refrigerated: { text: 'مبرد', icon: <FaSnowflake />, class: 'bg-info' },
  dry: { text: 'جاف', icon: <FaSun />, class: 'bg-warning text-dark' },
  cold: { text: 'تجميد', icon: <FaSnowflake />, class: 'bg-primary' },
  hazardous: { text: 'مواد خطرة', icon: <FaBox />, class: 'bg-danger' },
};

const STAT_COLORS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)',
  'linear-gradient(135deg, #f39c12 0%, #f1c40f 100%)',
  'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
];

const formatNumber = (num?: number | null) => num?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') || '0';
const getPercentage = (a: number, b: number) => b === 0 ? 0 : Math.round((a / b) * 100);
const getCapacityColor = (p: number) => p >= 90 ? '#ef4444' : p >= 70 ? '#f59e0b' : '#10b981';
const getLocationStatus = (occ: number, cap: number) => {
  const p = getPercentage(occ, cap);
  return p >= 100 ? { text: 'ممتلئ', status: 'cancelled' as const } 
    : p >= 50 ? { text: 'مشغول جزئياً', status: 'pending' as const } 
    : { text: 'متاح', status: 'completed' as const };
};

const INITIAL_WAREHOUSE: Warehouse = {
  id: '', name: '', address: '', description: '', storage_type: 'dry',
  total_capacity: 0, used_capacity: 0, sections: 0, is_active: true, created_at: '',
};

const INITIAL_LOCATION = {
  warehouse_id: '', section: '', shelf: '', column: '', cell: '', capacity: 100, storage_type: 'dry' as StorageType,
};

export default function WarehousePage() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<ActiveTab>('warehouses');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);
  const [expandedWarehouse, setExpandedWarehouse] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<WarehouseLocation | null>(null);
const [editLocationModal, setEditLocationModal] = useState(false);
const [confirmDeleteLocation, setConfirmDeleteLocation] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [locations, setLocations] = useState<WarehouseLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [warehouseLocations, setWarehouseLocations] = useState<Record<string, WarehouseLocation[]>>({});
  const [newLocation, setNewLocation] = useState(INITIAL_LOCATION);

  const fetchWarehouses = useCallback(async () => {
    try {
      const res = await fetch('/api/warehouses');
      setWarehouses(await res.json());
    } catch { showToast('خطأ في جلب المستودعات', 'error'); } 
    finally { setIsLoading(false); }
  }, [showToast]);

  const fetchLocations = useCallback(async () => {
    try {
      const res = await fetch('/api/warehouse-locations');
      setLocations(await res.json());
    } catch { showToast('خطأ في جلب المواقع', 'error'); }
  }, [showToast]);
  const handleUpdateLocation = async () => {
  if (!selectedLocation) return;
  try {
    const res = await fetch(`/api/warehouse-locations/${selectedLocation.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(selectedLocation),
    });
    if (res.ok) {
      fetchLocations();
      setEditLocationModal(false);
      setSelectedLocation(null);
      showToast('تم تعديل الموقع بنجاح', 'success');
    } else {
      showToast('حدث خطأ', 'error');
    }
  } catch { showToast('حدث خطأ', 'error'); }
};

const confirmDeleteLocationHandler = async () => {
  if (!confirmDeleteLocation) return;
  try {
    const res = await fetch(`/api/warehouse-locations/${confirmDeleteLocation}`, { method: 'DELETE' });
    if (res.ok) {
      fetchLocations();
      showToast('تم حذف الموقع بنجاح', 'success');
    } else {
      showToast('حدث خطأ', 'error');
    }
  } catch { showToast('حدث خطأ', 'error'); }
  setConfirmDeleteLocation(null);
};

  useEffect(() => { fetchWarehouses(); fetchLocations(); }, [fetchWarehouses, fetchLocations]);

    const toggleWarehouseExpand = async (id: string) => {
        if (expandedWarehouse === id) return setExpandedWarehouse(null);
        setExpandedWarehouse(id);
        if (!warehouseLocations[id]) {
          try {
            const res = await fetch(`/api/warehouse-locations?warehouse_id=${id}`);
            const data = await res.json();
            setWarehouseLocations(prev => ({ ...prev, [id]: data }));
          } catch { showToast('خطأ في جلب المواقع', 'error'); }
        }
      };

  const handleSaveWarehouse = async () => {
    if (!selectedWarehouse?.name || !selectedWarehouse?.address) {
      return showToast('يرجى ملء الحقول المطلوبة', 'info');
    }
    try {
      const isEdit = !!selectedWarehouse.id;
      const res = await fetch(`/api/warehouses${isEdit ? `/${selectedWarehouse.id}` : ''}`, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedWarehouse),
      });
      if (res.ok) {
        fetchWarehouses();
        setShowAddModal(false);
        setSelectedWarehouse(null);
        showToast(isEdit ? 'تم تعديل المستودع بنجاح' : 'تم إضافة المستودع بنجاح', 'success');
      } else {
        const err = await res.json();
        showToast(err.error || 'حدث خطأ', 'error');
      }
    } catch { showToast('حدث خطأ', 'error'); }
  };

  const handleSaveLocation = async () => {
    if (!newLocation.warehouse_id || !newLocation.section || !newLocation.shelf) {
      return showToast('يرجى ملء الحقول المطلوبة', 'info');
    }
    try {
      const res = await fetch('/api/warehouse-locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLocation),
      });
      if (res.ok) {
        fetchLocations();
        setShowLocationModal(false);
        setNewLocation(INITIAL_LOCATION);
        showToast('تم إضافة موقع التخزين بنجاح', 'success');
      } else {
        const err = await res.json();
        showToast(err.error || 'حدث خطأ', 'error');
      }
    } catch { showToast('حدث خطأ', 'error'); }
  };

  const handleDeleteWarehouse = (id: string) => setConfirmDelete(id);

const confirmDeleteWarehouse = async () => {
  if (!confirmDelete) return;
  try {
    const res = await fetch(`/api/warehouses/${confirmDelete}`, { method: 'DELETE' });
    if (res.ok) { fetchWarehouses(); showToast('تم حذف المستودع بنجاح', 'success'); }
    else showToast('حدث خطأ', 'error');
  } catch { showToast('حدث خطأ', 'error'); }
  setConfirmDelete(null);
};

  const filteredWarehouses = warehouses.filter(w => w.name.includes(searchTerm) || w.address.includes(searchTerm));
  const filteredLocations = locations.filter(l => l.warehouse_name?.includes(searchTerm) || l.section.includes(searchTerm));
  const totalCapacity = warehouses.reduce((s, w) => s + (w.total_capacity || 0), 0);
  const totalUsed = warehouses.reduce((s, w) => s + (w.used_capacity || 0), 0);
  const activeCount = warehouses.filter(w => w.is_active).length;

  const stats = [
    { icon: <FaWarehouse />, value: warehouses.length, label: 'إجمالي المستودعات' },
    { icon: <FaCubes />, value: activeCount, label: 'مستودعات نشطة' },
    { icon: <FaBox />, value: formatNumber(totalCapacity), label: 'السعة الإجمالية' },
    { icon: <FaMapMarkerAlt />, value: `${getPercentage(totalUsed, totalCapacity)}%`, label: 'نسبة الإشغال' },
  ];

  if (isLoading) return (
    <div className="text-center py-5">
      <div className="spinner-border text-primary" />
      <p className="mt-2 text-muted">جاري تحميل البيانات...</p>
    </div>
  );

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="d-flex justify-content-between align-items-center mb-4 page-header">
        <div>
          <h2 className="fw-bold mb-1" style={{ color: '#0f172a' }}>المستودعات والمواقع</h2>
          <p className="text-muted mb-0" style={{ fontSize: '14px' }}>إدارة المستودعات ومواقع التخزين</p>
        </div>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="btn btn-primary d-flex align-items-center gap-2" style={{ borderRadius: '10px', padding: '10px 20px' }}
          onClick={() => {
            if (activeTab === 'warehouses') { setSelectedWarehouse(INITIAL_WAREHOUSE); setShowAddModal(true); }
            else setShowLocationModal(true);
          }}>
          <FaPlus /> {activeTab === 'warehouses' ? 'إضافة مستودع جديد' : 'إضافة موقع تخزين'}
        </motion.button>
      </motion.div>

      <div className="row g-3 mb-4">
        {stats.map((s, i) => (
          <motion.div key={i} className="col-md-3 col-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <div className="card text-white" style={{ borderRadius: '16px', background: STAT_COLORS[i] }}>
              <div className="card-body p-3 text-center">
                <span style={{ fontSize: '24px' }}>{s.icon}</span>
                <h3 className="fw-bold mt-2">{s.value}</h3>
                <small>{s.label}</small>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-4">
        <div style={{ display: 'flex', gap: '4px', backgroundColor: '#f1f5f9', padding: '4px', borderRadius: '12px', width: 'fit-content' }}>
          {[
            { id: 'warehouses', icon: <FaWarehouse size={14} />, label: 'المستودعات' },
            { id: 'locations', icon: <FaMapMarkerAlt size={14} />, label: 'مواقع التخزين' },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as ActiveTab)} style={{
              padding: '10px 24px', border: 'none', borderRadius: '10px', fontWeight: '600', fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s',
              backgroundColor: activeTab === tab.id ? 'white' : 'transparent',
              color: activeTab === tab.id ? '#444ce7' : '#475569',
              boxShadow: activeTab === tab.id ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
              display: 'flex', alignItems: 'center', gap: '8px',
            }}>{tab.icon} {tab.label}</button>
          ))}
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card mb-4" style={{ borderRadius: '16px' }}>
        <div className="card-body p-3">
          <div className="row g-3 align-items-center">
            <div className="col-md-8">
              <div style={{ position: 'relative' }}>
                <FaSearch style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input type="text" className="form-control" placeholder={activeTab === 'warehouses' ? 'بحث عن مستودع...' : 'بحث عن موقع...'}
                  value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                  style={{ padding: '10px 40px 10px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px' }} />
              </div>
            </div>
            <div className="col-md-4 text-end">
              <span className="text-muted" style={{ fontSize: '14px' }}>
                عدد النتائج: <strong>{activeTab === 'warehouses' ? filteredWarehouses.length : filteredLocations.length}</strong>
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {activeTab === 'warehouses' && (
        <div className="row g-4">
          {filteredWarehouses.length === 0 ? (
            <div className="col-12 text-center py-5">
              <FaWarehouse size={48} style={{ color: '#cbd5e1' }} />
              <h5 className="mt-3 text-muted">لا توجد مستودعات</h5>
              <p className="text-muted">قم بإضافة مستودع جديد للبدء</p>
            </div>
          ) : filteredWarehouses.map((w, i) => {
            const pct = getPercentage(w.used_capacity, w.total_capacity);
            const locs = warehouseLocations[w.id] || [];
            return (
              <motion.div key={w.id} className="col-lg-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ delay: i * 0.1 }}>
                <div className="card h-100" style={{ borderRadius: '16px', opacity: w.is_active ? 1 : 0.7 }}>
                  <div className="card-body p-4">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div className="d-flex align-items-center gap-3">
                        <div style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: '#f0f4ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#444ce7', fontSize: 22 }}><FaWarehouse /></div>
                        <div>
                          <h5 className="fw-bold mb-1">{w.name}</h5>
                          <div className="d-flex align-items-center gap-2">
                            <span className={`badge ${STORAGE_TYPES[w.storage_type].class}`} style={{ fontSize: 11, padding: '4px 8px' }}>{STORAGE_TYPES[w.storage_type].icon} {STORAGE_TYPES[w.storage_type].text}</span>
                            {!w.is_active && <span className="badge bg-secondary">غير نشط</span>}
                          </div>
                        </div>
                      </div>
                      <div className="d-flex gap-1">
                        {[
                          { icon: <FaEdit size={14} />, cls: 'outline-primary', onClick: () => { setSelectedWarehouse(w); setShowAddModal(true); }, title: 'تعديل' },
                          { icon: expandedWarehouse === w.id ? <FaChevronDown size={14} /> : <FaChevronLeft size={14} />, cls: 'outline-info', onClick: () => toggleWarehouseExpand(w.id), title: 'عرض المواقع' },
                          { icon: <FaTrash size={14} />, cls: 'outline-danger', onClick: () => handleDeleteWarehouse(w.id), title: 'حذف' },
                        ].map((btn, j) => (
                          <motion.button key={j} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className={`btn btn-sm btn-${btn.cls}`} style={{ borderRadius: 8 }} title={btn.title} onClick={btn.onClick}>{btn.icon}</motion.button>
                        ))}
                      </div>
                    </div>
                    <div className="mb-3">
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <FaMapMarkerAlt size={14} style={{ color: '#94a3b8' }} />
                        <span style={{ fontSize: 14, color: '#475569' }}>{w.address}</span>
                      </div>
                      {w.description && <p style={{ fontSize: 13, color: '#64748b' }}>{w.description}</p>}
                    </div>
                    <div>
                      <div className="d-flex justify-content-between mb-1">
                        <span style={{ fontSize: 13, fontWeight: 500 }}>السعة المستخدمة</span>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{formatNumber(w.used_capacity)} / {formatNumber(w.total_capacity)}</span>
                      </div>
                      <div className="progress" style={{ height: 10, borderRadius: 5 }}>
                        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, delay: 0.3 + i * 0.1 }}
                          className="progress-bar" style={{ backgroundColor: getCapacityColor(pct), borderRadius: 5 }} />
                      </div>
                      <div className="d-flex justify-content-between mt-1">
                        <span style={{ fontSize: 12, color: '#64748b' }}>{w.sections} أقسام</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: getCapacityColor(pct) }}>{pct}%</span>
                      </div>
                    </div>
                    <AnimatePresence>
                      {expandedWarehouse === w.id && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} style={{ overflow: 'hidden' }}>
                          <div style={{ backgroundColor: '#f8fafc', borderRadius: 12, padding: 16, marginTop: 12 }}>
                            <h6 className="fw-bold mb-3" style={{ fontSize: 14 }}>مواقع التخزين</h6>
                            {locs.length === 0 ? <p className="text-muted text-center mb-0" style={{ fontSize: 13 }}>لا توجد مواقع تخزين</p> :
                              locs.map(loc => (
                                <div key={loc.id} className="d-flex justify-content-between align-items-center mb-2" style={{ padding: '8px 12px', backgroundColor: 'white', borderRadius: 8, fontSize: 13 }}>
                                  <div>
                                    <span className="fw-semibold">قسم {loc.section}</span>
                                    <span className="text-muted"> - رف {loc.shelf} - عمود {loc.column} - خلية {loc.cell}</span>
                                  </div>
                                  <StatusBadge status={getLocationStatus(loc.current_occupancy, loc.capacity).status} text={getLocationStatus(loc.current_occupancy, loc.capacity).text} />
                                </div>
                              ))
                            }
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {activeTab === 'locations' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card" style={{ borderRadius: 16, overflow: 'hidden' }}>
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead><tr style={{ backgroundColor: '#f8fafc', fontSize: 12 }}>
                {['#', 'المستودع', 'القسم', 'الرف', 'العمود', 'الخلية', 'نوع التخزين', 'السعة', 'الإشغال', 'الحالة', 'إجراءات'].map(h => <th key={h} className="px-4 py-3">{h}</th>)}
              </tr></thead>
              <tbody>
                {filteredLocations.length === 0 ? (
                  <tr><td colSpan={11} className="text-center py-4 text-muted">لا توجد مواقع تخزين</td></tr>
                ) : filteredLocations.map((loc, i) => {
                  const st = STORAGE_TYPES[loc.storage_type];
                  const ls = getLocationStatus(loc.current_occupancy, loc.capacity);
                  const pct = getPercentage(loc.current_occupancy, loc.capacity);
                  return (
                    <motion.tr key={loc.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                      <td className="px-4 py-3 fw-semibold">{i + 1}</td>
                      <td className="px-4 py-3">{loc.warehouse_name}</td>
                      <td className="px-4 py-3 fw-semibold">{loc.section}</td>
                      <td className="px-4 py-3">{loc.shelf}</td>
                      <td className="px-4 py-3">{loc.column}</td>
                      <td className="px-4 py-3">{loc.cell}</td>
                      <td className="px-4 py-3"><span className={`badge ${st.class}`} style={{ fontSize: 11, padding: '4px 8px' }}>{st.icon} {st.text}</span></td>
                      <td className="px-4 py-3">{loc.capacity}</td>
                      <td className="px-4 py-3">
                        <div className="d-flex align-items-center gap-2">
                          <div className="progress flex-grow-1" style={{ height: 6, borderRadius: 3 }}>
                            <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.5 }} className="progress-bar" style={{ backgroundColor: getCapacityColor(pct), borderRadius: 3 }} />
                          </div>
                          <span style={{ fontSize: 12 }}>{loc.current_occupancy}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={ls.status} text={ls.text} /></td>
                     <td className="px-4 py-3">
                      <div className="d-flex gap-1">
                        <motion.button 
                          whileHover={{ scale: 1.1 }} 
                          whileTap={{ scale: 0.9 }} 
                          className="btn btn-sm btn-outline-primary" 
                          style={{ borderRadius: 8 }}
                          title="تعديل"
                          onClick={() => {
                            setSelectedLocation(loc);
                            setEditLocationModal(true);
                          }}
                        >
                          <FaEdit size={14} />
                        </motion.button>
                        <motion.button 
                          whileHover={{ scale: 1.1 }} 
                          whileTap={{ scale: 0.9 }} 
                          className="btn btn-sm btn-outline-danger" 
                          style={{ borderRadius: 8 }}
                          title="حذف"
                          onClick={() => setConfirmDeleteLocation(loc.id)}
                        >
                          <FaTrash size={14} />
                        </motion.button>
                      </div>
                    </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Warehouse Modal */}
      <Modal isOpen={showAddModal} onClose={() => { setShowAddModal(false); setSelectedWarehouse(null); }}
        title={selectedWarehouse?.id ? 'تعديل مستودع' : 'إضافة مستودع جديد'} size="lg"
        footer={
          <div className="d-flex justify-content-end gap-2">
            <button className="btn btn-secondary" onClick={() => { setShowAddModal(false); setSelectedWarehouse(null); }} style={{ borderRadius: 10 }}>إلغاء</button>
            <button className="btn btn-primary" style={{ borderRadius: 10 }} onClick={handleSaveWarehouse}>{selectedWarehouse?.id ? 'حفظ' : 'إضافة'}</button>
          </div>
        }>
        <div className="row">
          <div className="col-md-6 mb-3">
            <label className="form-label fw-semibold">اسم المستودع <span className="text-danger">*</span></label>
            <input type="text" className="form-control" value={selectedWarehouse?.name || ''} onChange={e => setSelectedWarehouse(p => p ? { ...p, name: e.target.value } : null)} style={{ borderRadius: 10 }} />
          </div>
          <div className="col-md-6 mb-3">
            <label className="form-label fw-semibold">نوع التخزين</label>
            <select className="form-select" value={selectedWarehouse?.storage_type || 'dry'} onChange={e => setSelectedWarehouse(p => p ? { ...p, storage_type: e.target.value as StorageType } : null)} style={{ borderRadius: 10 }}>
              {Object.entries(STORAGE_TYPES).map(([k, v]) => <option key={k} value={k}>{v.text}</option>)}
            </select>
          </div>
          <div className="col-12 mb-3">
            <label className="form-label fw-semibold">العنوان <span className="text-danger">*</span></label>
            <input type="text" className="form-control" value={selectedWarehouse?.address || ''} onChange={e => setSelectedWarehouse(p => p ? { ...p, address: e.target.value } : null)} style={{ borderRadius: 10 }} />
          </div>
          <div className="col-12 mb-3">
            <label className="form-label fw-semibold">الوصف</label>
            <textarea className="form-control" rows={3} value={selectedWarehouse?.description || ''} onChange={e => setSelectedWarehouse(p => p ? { ...p, description: e.target.value } : null)} style={{ borderRadius: 10 }} />
          </div>
          <div className="col-md-6 mb-3">
            <label className="form-label fw-semibold">السعة الإجمالية</label>
            <input type="number" className="form-control" value={selectedWarehouse?.total_capacity || 0} onChange={e => setSelectedWarehouse(p => p ? { ...p, total_capacity: +e.target.value } : null)} style={{ borderRadius: 10 }} />
          </div>
          {selectedWarehouse?.id && (
            <div className="col-md-6 mb-3">
              <label className="form-label fw-semibold">الحالة</label>
              <div className="form-check form-switch mt-2">
                <input className="form-check-input" type="checkbox" checked={selectedWarehouse?.is_active} onChange={e => setSelectedWarehouse(p => p ? { ...p, is_active: e.target.checked } : null)} />
                <label className="form-check-label">المستودع نشط</label>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Location Modal */}
      <Modal isOpen={showLocationModal} onClose={() => { setShowLocationModal(false); setNewLocation(INITIAL_LOCATION); }}
        title="إضافة موقع تخزين جديد" size="lg"
        footer={
          <div className="d-flex justify-content-end gap-2">
            <button className="btn btn-secondary" onClick={() => setShowLocationModal(false)} style={{ borderRadius: 10 }}>إلغاء</button>
            <button className="btn btn-primary" style={{ borderRadius: 10 }} onClick={handleSaveLocation}>إضافة</button>
          </div>
        }>
        <div className="row">
          <div className="col-md-6 mb-3">
            <label className="form-label fw-semibold">المستودع <span className="text-danger">*</span></label>
            <select className="form-select" value={newLocation.warehouse_id} onChange={e => setNewLocation({ ...newLocation, warehouse_id: e.target.value })} style={{ borderRadius: 10 }}>
              <option value="">اختر المستودع</option>
              {warehouses.filter(w => w.is_active).map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
          <div className="col-md-6 mb-3">
            <label className="form-label fw-semibold">نوع التخزين</label>
            <select className="form-select" value={newLocation.storage_type} onChange={e => setNewLocation({ ...newLocation, storage_type: e.target.value as StorageType })} style={{ borderRadius: 10 }}>
              {Object.entries(STORAGE_TYPES).map(([k, v]) => <option key={k} value={k}>{v.text}</option>)}
            </select>
          </div>
          {[
            { label: 'القسم', key: 'section', col: 3 },
            { label: 'الرف', key: 'shelf', col: 3 },
            { label: 'العمود', key: 'column', col: 3 },
            { label: 'الخلية', key: 'cell', col: 3 },
          ].map(f => (
            <div key={f.key} className={`col-md-${f.col} mb-3`}>
              <label className="form-label fw-semibold">{f.label} <span className="text-danger">*</span></label>
              <input type="text" className="form-control" value={newLocation[f.key as keyof typeof newLocation]} onChange={e => setNewLocation({ ...newLocation, [f.key]: e.target.value })} style={{ borderRadius: 10 }} />
            </div>
          ))}
          <div className="col-md-6 mb-3">
            <label className="form-label fw-semibold">السعة</label>
            <input type="number" className="form-control" value={newLocation.capacity} onChange={e => setNewLocation({ ...newLocation, capacity: +e.target.value })} style={{ borderRadius: 10 }} />
          </div>
        </div>
      </Modal>
            <ConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={confirmDeleteWarehouse}
        title="حذف المستودع"
        message="هل أنت متأكد من حذف هذا المستودع؟ لا يمكن التراجع عن هذا الإجراء."
        confirmText="حذف"
        cancelText="إلغاء"
        type="danger"
      />
      {/* Edit Location Modal */}
<Modal
  isOpen={editLocationModal}
  onClose={() => { setEditLocationModal(false); setSelectedLocation(null); }}
  title="تعديل موقع تخزين"
  size="lg"
  footer={
    <div className="d-flex justify-content-end gap-2">
      <button className="btn btn-secondary" onClick={() => { setEditLocationModal(false); setSelectedLocation(null); }} style={{ borderRadius: 10 }}>إلغاء</button>
      <button className="btn btn-primary" style={{ borderRadius: 10 }} onClick={handleUpdateLocation}>حفظ</button>
    </div>
  }
>
  {selectedLocation && (
    <div className="row">
      <div className="col-md-6 mb-3">
        <label className="form-label fw-semibold">القسم</label>
        <input type="text" className="form-control" value={selectedLocation.section} onChange={e => setSelectedLocation({ ...selectedLocation, section: e.target.value })} style={{ borderRadius: 10 }} />
      </div>
      <div className="col-md-6 mb-3">
        <label className="form-label fw-semibold">الرف</label>
        <input type="text" className="form-control" value={selectedLocation.shelf} onChange={e => setSelectedLocation({ ...selectedLocation, shelf: e.target.value })} style={{ borderRadius: 10 }} />
      </div>
      <div className="col-md-6 mb-3">
        <label className="form-label fw-semibold">العمود</label>
        <input type="text" className="form-control" value={selectedLocation.column} onChange={e => setSelectedLocation({ ...selectedLocation, column: e.target.value })} style={{ borderRadius: 10 }} />
      </div>
      <div className="col-md-6 mb-3">
        <label className="form-label fw-semibold">الخلية</label>
        <input type="text" className="form-control" value={selectedLocation.cell} onChange={e => setSelectedLocation({ ...selectedLocation, cell: e.target.value })} style={{ borderRadius: 10 }} />
      </div>
      <div className="col-md-6 mb-3">
        <label className="form-label fw-semibold">السعة</label>
        <input type="number" className="form-control" value={selectedLocation.capacity} onChange={e => setSelectedLocation({ ...selectedLocation, capacity: +e.target.value })} style={{ borderRadius: 10 }} />
      </div>
    </div>
  )}
          </Modal>

          {/* Confirm Delete Location */}
          <ConfirmDialog
            isOpen={!!confirmDeleteLocation}
            onClose={() => setConfirmDeleteLocation(null)}
            onConfirm={confirmDeleteLocationHandler}
            title="حذف الموقع"
            message="هل أنت متأكد من حذف موقع التخزين هذا؟"
            confirmText="حذف"
            type="danger"
          />
    </div>
  );
}
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/lib/toast-context';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCog, FaRuler, FaSave, FaPlus, FaEdit, FaTrash, FaBell, FaArchive } from 'react-icons/fa';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

interface MeasurementUnit {
  id: string;
  name: string;
  abbreviation: string;
  base_unit_id: string | null;
  conversion_factor: number;
}

export default function SettingsPage() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('units');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Units
  const [units, setUnits] = useState<MeasurementUnit[]>([]);
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<MeasurementUnit | null>(null);
  const [unitForm, setUnitForm] = useState({ name: '', abbreviation: '', conversion_factor: 1 });
  const [confirmDeleteUnit, setConfirmDeleteUnit] = useState<string | null>(null);

  // Settings
  const [settings, setSettings] = useState({
    systemName: 'نظام إدارة المستودعات',
    dateFormat: 'YYYY-MM-DD',
    lowStockAlert: '20',
    expiryAlertDays: '30',
    enableNotifications: true,
    enableBehaviorAnalysis: true,
    enableErrorDetection: true,
    enableSmartReports: true,
  });

  const fetchUnits = useCallback(async () => {
    try {
      const res = await fetch('/api/settings/units');
      setUnits(await res.json());
    } catch {}
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data.systemName) setSettings(prev => ({ ...prev, ...data }));
    } catch {} finally { setIsLoading(false); }
  };

  useEffect(() => { fetchUnits(); fetchSettings(); }, [fetchUnits]);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (res.ok) showToast('تم حفظ الإعدادات بنجاح', 'success');
      else showToast('حدث خطأ', 'error');
    } catch { showToast('حدث خطأ', 'error'); }
    setIsSaving(false);
  };

  const handleSaveUnit = async () => {
    if (!unitForm.name || !unitForm.abbreviation) {
      showToast('يرجى ملء الحقول المطلوبة', 'info'); return;
    }
    try {
      const url = selectedUnit ? `/api/settings/units/${selectedUnit.id}` : '/api/settings/units';
      const method = selectedUnit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(unitForm),
      });

      if (res.ok) {
        fetchUnits();
        setShowUnitModal(false);
        setSelectedUnit(null);
        setUnitForm({ name: '', abbreviation: '', conversion_factor: 1 });
        showToast(selectedUnit ? 'تم تعديل الوحدة' : 'تمت الإضافة', 'success');
      } else showToast('حدث خطأ', 'error');
    } catch { showToast('حدث خطأ', 'error'); }
  };

  const handleDeleteUnit = (id: string) => setConfirmDeleteUnit(id);

  const confirmDeleteUnitHandler = async () => {
    if (!confirmDeleteUnit) return;
    try {
      await fetch(`/api/settings/units/${confirmDeleteUnit}`, { method: 'DELETE' });
      fetchUnits();
      showToast('تم الحذف', 'success');
    } catch { showToast('حدث خطأ', 'error'); }
    setConfirmDeleteUnit(null);
  };

  const tabs = [
    { id: 'units', label: 'وحدات القياس', icon: <FaRuler /> },
    { id: 'general', label: 'إعدادات عامة', icon: <FaCog /> },
    { id: 'notifications', label: 'الإشعارات الذكية', icon: <FaBell /> },
    { id: 'archive', label: 'الأرشفة', icon: <FaArchive /> },
  ];

  if (isLoading) return <div className="text-center py-5"><div className="spinner-border text-primary" /><p className="mt-2 text-muted">جاري التحميل...</p></div>;

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="d-flex justify-content-between align-items-center mb-4">
        <div><h2 className="fw-bold mb-1" style={{ color: '#0f172a' }}>الإعدادات</h2><p className="text-muted mb-0" style={{ fontSize: 14 }}>إعدادات النظام ووحدات القياس</p></div>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="btn btn-primary d-flex align-items-center gap-2" style={{ borderRadius: 10, padding: '10px 20px' }} onClick={handleSaveSettings} disabled={isSaving}>
          <FaSave /> {isSaving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
        </motion.button>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
        <div className="d-flex flex-wrap gap-2">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              padding: '10px 20px', borderRadius: 12, fontWeight: 600, fontSize: 14, cursor: 'pointer', transition: 'all 0.2s',
              backgroundColor: activeTab === tab.id ? '#444ce7' : 'white', color: activeTab === tab.id ? 'white' : '#475569',
              boxShadow: activeTab === tab.id ? '0 4px 12px rgba(68,76,231,0.3)' : '0 1px 3px rgba(0,0,0,0.1)',
              border: activeTab === tab.id ? 'none' : '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 8,
            }}>{tab.icon} {tab.label}</button>
          ))}
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>

          {/* وحدات القياس */}
          {activeTab === 'units' && (
            <div className="card" style={{ borderRadius: 16 }}>
              <div className="card-header bg-white border-0 pt-4 px-4 d-flex justify-content-between align-items-center">
                <h5 className="fw-bold mb-0">وحدات القياس ومعاملات التحويل</h5>
                <button className="btn btn-primary d-flex align-items-center gap-2" style={{ borderRadius: 10 }} onClick={() => { setSelectedUnit(null); setUnitForm({ name: '', abbreviation: '', conversion_factor: 1 }); setShowUnitModal(true); }}>
                  <FaPlus size={14} /> إضافة وحدة
                </button>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead><tr style={{ backgroundColor: '#f8fafc', fontSize: 12 }}><th>اسم الوحدة</th><th>الاختصار</th><th>معامل التحويل</th><th>مثال</th><th>إجراءات</th></tr></thead>
                    <tbody>
                      {units.map(unit => (
                        <tr key={unit.id}>
                          <td className="fw-semibold">{unit.name}</td>
                          <td><code style={{ backgroundColor: '#f1f5f9', padding: '4px 10px', borderRadius: 6 }}>{unit.abbreviation}</code></td>
                          <td className="fw-bold" style={{ color: '#444ce7' }}>×{unit.conversion_factor}</td>
                          <td className="text-muted" style={{ fontSize: 13 }}>{unit.conversion_factor > 1 ? `1 ${unit.name} = ${unit.conversion_factor} وحدة` : 'الوحدة الأساسية'}</td>
                          <td>
                            <div className="d-flex gap-1">
                              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="btn btn-sm btn-outline-primary" style={{ borderRadius: 8 }} onClick={() => { setSelectedUnit(unit); setUnitForm({ name: unit.name, abbreviation: unit.abbreviation, conversion_factor: unit.conversion_factor }); setShowUnitModal(true); }}><FaEdit size={14} /></motion.button>
                              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="btn btn-sm btn-outline-danger" style={{ borderRadius: 8 }} onClick={() => handleDeleteUnit(unit.id)}><FaTrash size={14} /></motion.button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* الإعدادات العامة */}
          {activeTab === 'general' && (
            <div className="row g-4">
              <div className="col-lg-6">
                <div className="card" style={{ borderRadius: 16 }}>
                  <div className="card-header bg-white border-0 pt-4 px-4"><h5 className="fw-bold mb-0">إعدادات النظام</h5></div>
                  <div className="card-body">
                    <div className="mb-3">
                      <label className="form-label fw-semibold">اسم النظام</label>
                      <input type="text" className="form-control" value={settings.systemName} onChange={e => setSettings({ ...settings, systemName: e.target.value })} style={{ borderRadius: 10 }} />
                    </div>
                    <div className="mb-3">
                      <label className="form-label fw-semibold">تنسيق التاريخ</label>
                      <select className="form-select" value={settings.dateFormat} onChange={e => setSettings({ ...settings, dateFormat: e.target.value })} style={{ borderRadius: 10 }}>
                        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                        <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                        <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-lg-6">
                <div className="card" style={{ borderRadius: 16 }}>
                  <div className="card-header bg-white border-0 pt-4 px-4"><h5 className="fw-bold mb-0">إعدادات المخزون</h5></div>
                  <div className="card-body">
                    <div className="mb-3">
                      <label className="form-label fw-semibold">حد التنبيه للمخزون المنخفض (%)</label>
                      <input type="number" className="form-control" value={settings.lowStockAlert} onChange={e => setSettings({ ...settings, lowStockAlert: e.target.value })} style={{ borderRadius: 10 }} />
                    </div>
                    <div className="mb-3">
                      <label className="form-label fw-semibold">التنبيه قبل انتهاء الصلاحية (يوم)</label>
                      <input type="number" className="form-control" value={settings.expiryAlertDays} onChange={e => setSettings({ ...settings, expiryAlertDays: e.target.value })} style={{ borderRadius: 10 }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* الإشعارات الذكية */}
          {activeTab === 'notifications' && (
            <div className="row g-4">
              <div className="col-lg-6">
                <div className="card" style={{ borderRadius: 16 }}>
                  <div className="card-header bg-white border-0 pt-4 px-4"><h5 className="fw-bold mb-0">الإشعارات الذكية</h5></div>
                  <div className="card-body">
                    {[
                      { key: 'enableNotifications', label: 'تفعيل نظام الإشعارات', desc: 'إرسال إشعارات عند انخفاض المخزون أو اقتراب الصلاحية' },
                      { key: 'enableBehaviorAnalysis', label: 'تحليل السلوك', desc: 'تحليل سلوك المستخدمين وإرسال تنبيهات عند اكتشاف أنماط غير اعتيادية' },
                      { key: 'enableErrorDetection', label: 'تحليل الأخطاء', desc: 'اكتشاف الأخطاء المتكررة في العمليات واقتراح تحسينات' },
                      { key: 'enableSmartReports', label: 'تقارير ذكية للمدير', desc: 'تقارير أسبوعية تلقائية تلخص أداء المستودع والموظفين' },
                    ].map(item => (
                      <div key={item.key} className="d-flex justify-content-between align-items-center mb-3 p-3" style={{ backgroundColor: '#f8fafc', borderRadius: 10 }}>
                        <div><p className="mb-0 fw-semibold" style={{ fontSize: 14 }}>{item.label}</p><small className="text-muted">{item.desc}</small></div>
                        <div className="form-check form-switch">
                          <input className="form-check-input" type="checkbox" checked={(settings as any)[item.key] === true || (settings as any)[item.key] === 'true'} onChange={e => setSettings({ ...settings, [item.key]: e.target.checked })} style={{ cursor: 'pointer' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="col-lg-6">
                <div className="card" style={{ borderRadius: 16, backgroundColor: '#f0f4ff', border: '1px solid #c7d7fe' }}>
                  <div className="card-body p-4">
                    <h5 className="fw-bold mb-3" style={{ color: '#444ce7' }}>كيف تعمل الإشعارات الذكية؟</h5>
                    <div className="mb-3 p-3" style={{ backgroundColor: 'white', borderRadius: 10 }}>
                      <p className="fw-semibold mb-1">تحليل السلوك</p>
                      <p className="text-muted mb-0" style={{ fontSize: 13 }}>يراقب النظام نشاط المستخدمين ويكتشف أي سلوك غير معتاد مثل محاولات تسجيل دخول فاشلة متكررة أو عمليات حذف جماعية.</p>
                    </div>
                    <div className="mb-3 p-3" style={{ backgroundColor: 'white', borderRadius: 10 }}>
                      <p className="fw-semibold mb-1">تحليل الأخطاء</p>
                      <p className="text-muted mb-0" style={{ fontSize: 13 }}>يتتبع النظام الأخطاء المتكررة في العمليات ويقدم توصيات للتحسين مثل تعديل الحد الأدنى للمخزون.</p>
                    </div>
                    <div className="p-3" style={{ backgroundColor: 'white', borderRadius: 10 }}>
                      <p className="fw-semibold mb-1">تقارير ذكية</p>
                      <p className="text-muted mb-0" style={{ fontSize: 13 }}>يتم إنشاء تقارير أسبوعية تلقائياً تشمل أداء المستودع، الموظفين الأكثر إنتاجية، والمنتجات الراكدة.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* الأرشفة */}
          {activeTab === 'archive' && (
            <div className="card" style={{ borderRadius: 16 }}>
              <div className="card-header bg-white border-0 pt-4 px-4"><h5 className="fw-bold mb-0">إعدادات الأرشفة</h5></div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-semibold">أرشفة البيانات بعد (يوم)</label>
                    <input type="number" className="form-control" defaultValue={365} style={{ borderRadius: 10 }} />
                  </div>
                </div>
                {[
                  { label: 'الأوامر المكتملة', count: 1250, size: '45 MB' },
                  { label: 'الحركات اليومية', count: 8900, size: '120 MB' },
                  { label: 'سجل التدقيق', count: 3450, size: '68 MB' },
                ].map((item, i) => (
                  <div key={i} className="d-flex justify-content-between align-items-center mb-3 p-3" style={{ backgroundColor: '#f8fafc', borderRadius: 10 }}>
                    <div><p className="mb-0 fw-semibold">{item.label}</p><small className="text-muted">{item.count} سجل | {item.size}</small></div>
                    <button className="btn btn-sm btn-outline-primary" style={{ borderRadius: 8 }}>أرشفة الآن</button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </motion.div>
      </AnimatePresence>

      {/* Unit Modal */}
      <Modal isOpen={showUnitModal} onClose={() => { setShowUnitModal(false); setSelectedUnit(null); }}
        title={selectedUnit ? 'تعديل وحدة قياس' : 'إضافة وحدة قياس'} size="md"
        footer={<div className="d-flex justify-content-end gap-2"><button className="btn btn-secondary" onClick={() => setShowUnitModal(false)} style={{ borderRadius: 10 }}>إلغاء</button><button className="btn btn-primary" style={{ borderRadius: 10 }} onClick={handleSaveUnit}>حفظ</button></div>}>
        <div className="mb-3"><label className="form-label fw-semibold">اسم الوحدة</label><input type="text" className="form-control" value={unitForm.name} onChange={e => setUnitForm({ ...unitForm, name: e.target.value })} style={{ borderRadius: 10 }} /></div>
        <div className="mb-3"><label className="form-label fw-semibold">الاختصار</label><input type="text" className="form-control" value={unitForm.abbreviation} onChange={e => setUnitForm({ ...unitForm, abbreviation: e.target.value })} style={{ borderRadius: 10 }} /></div>
        <div className="mb-3"><label className="form-label fw-semibold">معامل التحويل</label><input type="number" className="form-control" value={unitForm.conversion_factor} onChange={e => setUnitForm({ ...unitForm, conversion_factor: +e.target.value })} style={{ borderRadius: 10 }} /></div>
      </Modal>

      <ConfirmDialog isOpen={!!confirmDeleteUnit} onClose={() => setConfirmDeleteUnit(null)} onConfirm={confirmDeleteUnitHandler} title="حذف الوحدة" message="هل أنت متأكد من حذف وحدة القياس هذه؟" confirmText="حذف" type="danger" />
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaCalendarTimes, FaExclamationTriangle, FaBox, FaArrowRight } from 'react-icons/fa';

interface ExpiryReportProps {
  dateRange: string;
  onBack?: () => void;
}

export default function ExpiryReport({ dateRange, onBack }: ExpiryReportProps) {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/reports/expiry');
      setData(await res.json());
    } catch {} finally { setIsLoading(false); }
  };

  if (isLoading) return <div className="text-center py-5"><div className="spinner-border text-success" /><p className="mt-2 text-muted">جاري التحميل...</p></div>;
  if (!data) return null;

  return (
    <div>
      {onBack && <button onClick={onBack} className="btn btn-light mb-3 d-flex align-items-center gap-2" style={{ borderRadius: 10, border: '1px solid #e8e8e8' }}><FaArrowRight /> العودة لقائمة التقارير</button>}

      <div className="row g-3 mb-4">
        {[
          { label: 'منتجات منتهية', value: data.summary.expiredCount, icon: <FaCalendarTimes size={24} />, bg: '#e74c3c' },
          { label: 'ستنتهي خلال 30 يوم', value: data.summary.dangerCount, icon: <FaExclamationTriangle size={24} />, bg: '#f59e0b' },
          { label: 'ستنتهي خلال 60 يوم', value: data.summary.warningCount, icon: <FaBox size={24} />, bg: '#3b82f6' },
        ].map((s, i) => (
          <motion.div key={i} className="col-md-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <div className="card text-white text-center" style={{ borderRadius: 16, backgroundColor: s.bg, border: 'none' }}>
              <div className="card-body p-4"><div className="mb-3">{s.icon}</div><h3 className="fw-bold">{s.value}</h3><small style={{ opacity: 0.9 }}>{s.label}</small></div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="card" style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid #e8e8e8' }}>
        <div className="card-header bg-white border-0 pt-4 px-4"><h5 className="fw-bold mb-0" style={{ color: '#1a1a1a' }}>المنتجات التي قاربت على الانتهاء</h5></div>
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead><tr style={{ backgroundColor: '#fafafa', fontSize: 12 }}><th className="px-4 py-3">المنتج</th><th className="px-4 py-3">الباركود</th><th className="px-4 py-3">المخزون</th><th className="px-4 py-3">تاريخ الصلاحية</th><th className="px-4 py-3">الأيام المتبقية</th><th className="px-4 py-3">الموقع</th><th className="px-4 py-3">الإجراء المقترح</th></tr></thead>
            <tbody>
              {data.products?.filter((p: any) => p.status !== 'safe').length === 0 ? <tr><td colSpan={7} className="text-center py-4 text-muted">جميع المنتجات سليمة</td></tr> :
                data.products?.filter((p: any) => p.status !== 'safe').map((product: any, i: number) => (
                  <motion.tr key={product.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    style={{ backgroundColor: product.status === 'expired' ? '#fef2f2' : product.status === 'danger' ? '#fffbf0' : 'transparent' }}>
                    <td className="px-4 py-3 fw-semibold" style={{ fontSize: 13 }}>{product.name}</td>
                    <td className="px-4 py-3"><code style={{ fontSize: 11, backgroundColor: '#f5f5f5', padding: '4px 8px', borderRadius: 6 }}>{product.barcode}</code></td>
                    <td className="px-4 py-3 fw-bold" style={{ fontSize: 14 }}>{product.stock}</td>
                    <td className="px-4 py-3" style={{ fontSize: 13, color: product.status === 'expired' ? '#e74c3c' : '#1a1a1a' }}>{product.expiryDate}</td>
                    <td className="px-4 py-3"><span className={`badge ${product.status === 'expired' ? 'bg-danger' : product.status === 'danger' ? 'bg-danger' : 'bg-warning text-dark'}`} style={{ fontSize: 11 }}>{product.status === 'expired' ? 'منتهي' : `${product.daysLeft} يوم`}</span></td>
                    <td className="px-4 py-3 text-muted" style={{ fontSize: 12 }}>{product.location}</td>
                    <td className="px-4 py-3" style={{ fontSize: 12, fontWeight: 500, color: product.status === 'expired' ? '#e74c3c' : product.status === 'danger' ? '#f59e0b' : '#6b6b6b' }}>
                      {product.status === 'expired' ? 'يجب التخلص منه' : product.status === 'danger' ? 'تخفيض السعر' : 'مراقبة'}
                    </td>
                  </motion.tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
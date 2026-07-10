'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaTrash, FaCalendarTimes, FaBox, FaArrowRight } from 'react-icons/fa';

interface LossReportProps {
  dateRange: string;
  onBack?: () => void;
}

export default function LossReport({ dateRange, onBack }: LossReportProps) {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/reports/loss');
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status" />
        <p className="mt-2 text-muted">جاري تحميل التقرير...</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div>
      {onBack && (
        <button onClick={onBack} className="btn btn-light mb-3 d-flex align-items-center gap-2"
          style={{ borderRadius: '10px', border: '1px solid var(--surface-200)' }}>
          <FaArrowRight /> العودة لقائمة التقارير
        </button>
      )}

      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="card text-white" style={{ borderRadius: '16px', background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)' }}>
            <div className="card-body p-4 text-center">
              <FaTrash size={28} className="mb-3" />
              <h3 className="fw-bold">${data.summary.totalLossValue?.toLocaleString('en-US')}</h3>
              <small>إجمالي قيمة الخسائر</small>
            </div>
          </motion.div>
        </div>
        <div className="col-md-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="card text-white" style={{ borderRadius: '16px', background: 'linear-gradient(135deg, #f39c12 0%, #f1c40f 100%)' }}>
            <div className="card-body p-4 text-center">
              <FaBox size={28} className="mb-3" />
              <h3 className="fw-bold">{data.summary.totalLossItems}</h3>
              <small>عدد القطع التالفة/المنتهية</small>
            </div>
          </motion.div>
        </div>
        <div className="col-md-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="card text-white" style={{ borderRadius: '16px', background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)' }}>
            <div className="card-body p-4 text-center">
              <FaCalendarTimes size={28} className="mb-3" />
              <h3 className="fw-bold">{data.summary.expiredCount}</h3>
              <small>منتجات منتهية الصلاحية</small>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="card" style={{ borderRadius: '16px', overflow: 'hidden' }}>
        <div className="card-header bg-white border-0 pt-4 px-4">
          <h5 className="fw-bold mb-0">تفاصيل الخسائر</h5>
        </div>
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead>
              <tr style={{ backgroundColor: 'var(--surface-50)', fontSize: '12px' }}>
                <th className="px-4 py-3">المنتج</th>
                <th className="px-4 py-3">الباركود</th>
                <th className="px-4 py-3">الكمية</th>
                <th className="px-4 py-3">السبب</th>
                <th className="px-4 py-3">القيمة</th>
                <th className="px-4 py-3">التاريخ</th>
                <th className="px-4 py-3">المستودع</th>
              </tr>
            </thead>
            <tbody>
              {data.losses?.map((loss: any, index: number) => (
                <motion.tr key={loss.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                  <td className="px-4 py-3 fw-semibold">{loss.product}</td>
                  <td className="px-4 py-3"><code style={{ fontSize: '12px' }}>{loss.barcode}</code></td>
                  <td className="px-4 py-3 fw-bold text-danger">{loss.quantity}</td>
                  <td className="px-4 py-3"><span className="badge bg-danger">{loss.reason}</span></td>
                  <td className="px-4 py-3 fw-semibold text-danger">${loss.value?.toLocaleString('en-US')}</td>
                  <td className="px-4 py-3 text-muted">{loss.date}</td>
                  <td className="px-4 py-3">{loss.warehouse}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
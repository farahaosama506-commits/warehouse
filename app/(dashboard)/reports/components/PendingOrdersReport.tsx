'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaClock, FaTruck, FaExclamationTriangle, FaWarehouse, FaArrowRight } from 'react-icons/fa';
import StatusBadge from '@/components/ui/StatusBadge';

interface PendingOrdersReportProps {
  dateRange: string;
  onBack?: () => void;
}

export default function PendingOrdersReport({ dateRange, onBack }: PendingOrdersReportProps) {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/reports/pending-orders');
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
        {[
          { label: 'إجمالي المهام المعلقة', value: data.summary.totalPending, icon: <FaClock />, color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
          { label: 'أوامر متأخرة', value: data.summary.delayedOrders, icon: <FaExclamationTriangle />, color: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)' },
          { label: 'أوامر عاجلة', value: data.summary.urgentOrders, icon: <FaWarehouse />, color: 'linear-gradient(135deg, #f39c12 0%, #f1c40f 100%)' },
          { label: 'في الموعد', value: data.summary.onTime, icon: <FaTruck />, color: 'linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)' },
        ].map((item, i) => (
          <div key={i} className="col-md-3">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="card text-white" style={{ borderRadius: '16px', background: item.color }}>
              <div className="card-body p-4 text-center">
                <span style={{ fontSize: '24px' }}>{item.icon}</span>
                <h3 className="fw-bold mt-2">{item.value}</h3>
                <small>{item.label}</small>
              </div>
            </motion.div>
          </div>
        ))}
      </div>

      <div className="card" style={{ borderRadius: '16px', overflow: 'hidden' }}>
        <div className="card-header bg-white border-0 pt-4 px-4">
          <h5 className="fw-bold mb-0">قائمة المهام المعلقة</h5>
        </div>
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead>
              <tr style={{ backgroundColor: 'var(--surface-50)', fontSize: '12px' }}>
                <th className="px-4 py-3">رقم الأمر</th>
                <th className="px-4 py-3">النوع</th>
                <th className="px-4 py-3">المنتج</th>
                <th className="px-4 py-3">الكمية</th>
                <th className="px-4 py-3">التاريخ المتوقع</th>
                <th className="px-4 py-3">التأخير</th>
                <th className="px-4 py-3">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {data.orders?.map((order: any, index: number) => (
                <motion.tr key={order.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
                  style={{ backgroundColor: order.isUrgent ? '#fff5f5' : order.delay > 0 ? '#fffbf0' : 'transparent' }}>
                  <td className="px-4 py-3 fw-semibold" style={{ color: 'var(--primary-600)' }}>{order.order_number}</td>
                  <td className="px-4 py-3">
                    <span className={`badge bg-${order.type === 'inbound' ? 'success' : order.type === 'outbound' ? 'primary' : 'info'}`}>
                      {order.typeText}
                    </span>
                  </td>
                  <td className="px-4 py-3 fw-semibold">{order.product_name}</td>
                  <td className="px-4 py-3 fw-bold">{order.quantity}</td>
                  <td className="px-4 py-3">{order.expected_date}</td>
                  <td className="px-4 py-3">
                    {order.delay > 0 ? <span className="badge bg-danger">{order.delay} أيام</span> : <span className="badge bg-success">في الموعد</span>}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={order.status} text={order.status === 'pending' ? 'معلق' : 'قيد التنفيذ'} />
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
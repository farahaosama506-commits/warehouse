'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaArrowUp, FaArrowDown, FaMinus, FaArrowRight } from 'react-icons/fa';

interface SalesVelocityReportProps {
  dateRange: string;
  onBack?: () => void;
}

export default function SalesVelocityReport({ dateRange, onBack }: SalesVelocityReportProps) {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/reports/sales-velocity');
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
        <div className="col-md-3">
          <div className="card text-white" style={{ borderRadius: '16px', background: 'linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)' }}>
            <div className="card-body p-3 text-center">
              <h5 className="fw-bold mb-0">{data.summary.highVelocity}</h5>
              <small>منتجات عالية السرعة</small>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-white" style={{ borderRadius: '16px', background: 'linear-gradient(135deg, #f39c12 0%, #f1c40f 100%)' }}>
            <div className="card-body p-3 text-center">
              <h5 className="fw-bold mb-0">{data.summary.mediumVelocity}</h5>
              <small>منتجات متوسطة</small>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-white" style={{ borderRadius: '16px', background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)' }}>
            <div className="card-body p-3 text-center">
              <h5 className="fw-bold mb-0">{data.summary.lowVelocity}</h5>
              <small>منتجات راكدة</small>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-white" style={{ borderRadius: '16px', background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)' }}>
            <div className="card-body p-3 text-center">
              <h5 className="fw-bold mb-0">{data.summary.totalSales}</h5>
              <small>إجمالي المبيعات</small>
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ borderRadius: '16px', overflow: 'hidden' }}>
        <div className="card-header bg-white border-0 pt-4 px-4">
          <h5 className="fw-bold mb-0">سرعة بيع المنتجات</h5>
        </div>
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead>
              <tr style={{ backgroundColor: 'var(--surface-50)', fontSize: '12px' }}>
                <th className="px-4 py-3">المنتج</th>
                <th className="px-4 py-3">المبيعات</th>
                <th className="px-4 py-3">المخزون الحالي</th>
                <th className="px-4 py-3">معدل الدوران</th>
                <th className="px-4 py-3">التصنيف</th>
              </tr>
            </thead>
            <tbody>
              {data.products?.map((product: any, index: number) => (
                <motion.tr key={index} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                  <td className="px-4 py-3 fw-semibold">{product.name}</td>
                  <td className="px-4 py-3 fw-bold">{product.sales}</td>
                  <td className="px-4 py-3">{product.stock}</td>
                  <td className="px-4 py-3">{product.ratio.toFixed(1)}%</td>
                  <td className="px-4 py-3">
                    <span className={`badge bg-${product.status === 'completed' ? 'success' : product.status === 'processing' ? 'warning text-dark' : 'danger'}`}>
                      {product.velocity}
                    </span>
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
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaBox, FaDollarSign, FaWarehouse, FaArrowRight , FaDownload} from 'react-icons/fa';
import { exportToPDF } from '@/lib/export-pdf';
import { useToast } from '@/lib/toast-context';


interface InventoryValueReportProps {
  dateRange: string;
  onBack?: () => void;
  data?: any;
}

export default function InventoryValueReport({ dateRange, onBack }: InventoryValueReportProps) {
  const [data, setData] = useState<any>(null);
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/reports/inventory-value');
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


const handleExport = () => {
  if (!data) return;

  try {
    const headers = ['Warehouse', 'Items', 'Total Value', 'Percentage'];
    const rows = data.warehouseData?.map((item: any) => [
      item.warehouse,
      item.totalItems?.toLocaleString('en-US') || '0',
      `$${item.totalValue?.toLocaleString('en-US') || '0'}`,
      `${((item.totalValue / data.totalValue) * 100).toFixed(1)}%`,
    ]) || [];

    exportToPDF({
      title: 'Inventory Value Report',
      subtitle: `Total Inventory Value: $${data.totalValue?.toLocaleString('en-US') || '0'}`,
      headers,
      data: rows,
      fileName: `Inventory_Report_${new Date().toISOString().split('T')[0]}.pdf`,
      summary: [
        { label: 'Total Value', value: `$${data.totalValue?.toLocaleString('en-US') || '0'}` },
        { label: 'Total Items', value: data.totalItems?.toLocaleString('en-US') || '0' },
        { label: 'Average Value', value: `$${data.averageValue?.toLocaleString('en-US') || '0'}` },
      ],
    });

    showToast('تم تصدير التقرير بنجاح', 'success');
  } catch {
    showToast('حدث خطأ أثناء التصدير', 'error');
  }
};
  return (
    <div>
      {onBack && (
        <button onClick={onBack} className="btn btn-light mb-3 d-flex align-items-center gap-2"
          style={{ borderRadius: '10px', border: '1px solid var(--surface-200)' }}>
          <FaArrowRight /> العودة لقائمة التقارير
        </button>
      )}
              <button onClick={handleExport} className="btn btn-outline-success d-flex align-items-center gap-1" style={{ borderRadius: 10 }}>
          <FaDownload size={14} /> تصدير PDF
        </button>
      
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="card text-white" style={{ borderRadius: '16px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <span>إجمالي قيمة المخزون</span>
                <FaDollarSign size={24} />
              </div>
              <h2 className="fw-bold mb-0">${data.totalValue?.toLocaleString('en-US') || 0}</h2>
              <small>قيمة الأصول المجمدة</small>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card text-white" style={{ borderRadius: '16px', background: 'linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)' }}>
            <div className="card-body p-4">
              <FaBox size={24} className="mb-3" />
              <h2 className="fw-bold mb-0">{data.totalItems?.toLocaleString('en-US') || 0}</h2>
              <small>عدد المنتجات في المخزون</small>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card text-white" style={{ borderRadius: '16px', background: 'linear-gradient(135deg, #f39c12 0%, #f1c40f 100%)' }}>
            <div className="card-body p-4">
              <FaWarehouse size={24} className="mb-3" />
              <h2 className="fw-bold mb-0">${data.averageValue?.toLocaleString('en-US') || 0}</h2>
              <small>متوسط قيمة المخزون لكل مستودع</small>
            </div>
          </div>
        </div>

        <div className="col-12">
          <div className="card" style={{ borderRadius: '16px' }}>
            <div className="card-header bg-white border-0 pt-4 px-4">
              <h5 className="fw-bold mb-0">تفاصيل المخزون حسب المستودع</h5>
            </div>
            <div className="card-body">
              <table className="table table-hover">
                <thead>
                  <tr style={{ backgroundColor: 'var(--surface-50)' }}>
                    <th>المستودع</th>
                    <th>عدد العناصر</th>
                    <th>القيمة الإجمالية</th>
                    <th>النسبة</th>
                    <th>مؤشر</th>
                  </tr>
                </thead>
                <tbody>
                  {data.warehouseData?.map((item: any, index: number) => (
                    <motion.tr key={index} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
                      <td className="fw-semibold">{item.warehouse}</td>
                      <td>{item.totalItems?.toLocaleString('en-US')}</td>
                      <td className="fw-semibold">${item.totalValue?.toLocaleString('en-US')}</td>
                      <td>{((item.totalValue / data.totalValue) * 100).toFixed(1)}%</td>
                      <td>
                        <div className="progress" style={{ height: '8px', borderRadius: '4px' }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(item.totalValue / data.totalValue) * 100}%` }}
                            transition={{ duration: 1, delay: index * 0.2 }}
                            className="progress-bar bg-primary"
                            style={{ borderRadius: '4px' }}
                          />
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
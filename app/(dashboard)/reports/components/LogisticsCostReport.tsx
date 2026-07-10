'use client';

import { useState, useEffect, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { FaTruck, FaWarehouse, FaBoxOpen, FaMoneyBillWave, FaArrowRight } from 'react-icons/fa';

interface LogisticsCostReportProps {
  dateRange: string;
  onBack?: () => void;
}

const icons: { [key: string]: ReactNode } = {
  'نقل': <FaTruck />,
  'تخزين': <FaWarehouse />,
  'استلام': <FaBoxOpen />,
  'أخرى': <FaMoneyBillWave />,
};

export default function LogisticsCostReport({ dateRange, onBack }: LogisticsCostReportProps) {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/reports/logistics-cost?period=${dateRange}`);
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return `$${value.toLocaleString('en-US')}`;
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

      {/* Total Cost Card */}
      <div className="row mb-4">
        <div className="col-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="card text-white" style={{ borderRadius: '16px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <div className="card-body p-4 text-center">
              <FaMoneyBillWave size={32} className="mb-3" />
              <h2 className="fw-bold">{formatCurrency(data.totalCost)}</h2>
              <small style={{ opacity: 0.9 }}>إجمالي التكاليف اللوجستية - {dateRange === 'week' ? 'آخر أسبوع' : dateRange === 'month' ? 'آخر شهر' : dateRange === 'quarter' ? 'آخر 3 أشهر' : 'آخر سنة'}</small>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Cost Categories */}
      <div className="row g-3">
        {data.costs?.length === 0 ? (
          <div className="col-12 text-center py-4 text-muted">
            <FaMoneyBillWave size={48} style={{ color: 'var(--surface-300)' }} />
            <p className="mt-2">لا توجد تكاليف مسجلة في هذه الفترة</p>
          </div>
        ) : (
          data.costs?.map((cost: any, index: number) => (
            <motion.div key={index} className="col-md-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + index * 0.1 }}>
              <div className="card h-100" style={{ borderRadius: '16px' }}>
                <div className="card-body p-4">
                  <div className="d-flex align-items-center gap-3 mb-3">
                    <div style={{ 
                      width: '48px', height: '48px', borderRadius: '12px', 
                      backgroundColor: `${cost.color}15`, display: 'flex', alignItems: 'center', 
                      justifyContent: 'center', color: cost.color, fontSize: '22px', flexShrink: 0,
                    }}>
                      {icons[cost.category] || <FaMoneyBillWave />}
                    </div>
                    <div>
                      <h6 className="fw-bold mb-1">{cost.category}</h6>
                      <h4 className="fw-bold mb-0" style={{ color: cost.color }}>{formatCurrency(cost.amount)}</h4>
                    </div>
                    <div className="ms-auto text-end">
                      <span className="badge bg-light text-dark" style={{ fontSize: '14px' }}>{cost.percentage}%</span>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="progress mb-3" style={{ height: '8px', borderRadius: '4px' }}>
                    <motion.div 
                      initial={{ width: 0 }} 
                      animate={{ width: `${cost.percentage}%` }} 
                      transition={{ duration: 1, delay: 0.5 + index * 0.2 }}
                      className="progress-bar" 
                      style={{ backgroundColor: cost.color, borderRadius: '4px' }} 
                    />
                  </div>

                  {/* Items */}
                  <div>
                    {cost.items?.slice(0, 5).map((item: any, i: number) => (
                      <div key={i} className="d-flex justify-content-between mb-2">
                        <span className="text-muted" style={{ fontSize: '13px' }}>{item.description}</span>
                        <span className="fw-semibold" style={{ fontSize: '13px' }}>{formatCurrency(item.amount)}</span>
                      </div>
                    ))}
                    {cost.items?.length > 5 && (
                      <small className="text-muted">+ {cost.items.length - 5} عناصر أخرى</small>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
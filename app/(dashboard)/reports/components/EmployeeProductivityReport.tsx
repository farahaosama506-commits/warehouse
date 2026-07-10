'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaUser, FaCheckCircle, FaClock, FaArrowRight } from 'react-icons/fa';

interface EmployeeProductivityReportProps {
  dateRange: string;
  onBack?: () => void;
}

export default function EmployeeProductivityReport({ dateRange, onBack }: EmployeeProductivityReportProps) {
  const [employees, setEmployees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/reports/employee-productivity');
      const result = await response.json();
      setEmployees(result);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 90) return 'var(--accent-green)';
    if (efficiency >= 70) return 'var(--accent-amber)';
    return 'var(--accent-red)';
  };

  const getEfficiencyBadge = (efficiency: number) => {
    if (efficiency >= 90) return { text: 'ممتاز', class: 'bg-success' };
    if (efficiency >= 70) return { text: 'جيد', class: 'bg-warning text-dark' };
    return { text: 'ضعيف', class: 'bg-danger' };
  };

  if (isLoading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status" />
        <p className="mt-2 text-muted">جاري تحميل التقرير...</p>
      </div>
    );
  }

  return (
    <div>
      {onBack && (
        <button onClick={onBack} className="btn btn-light mb-3 d-flex align-items-center gap-2"
          style={{ borderRadius: '10px', border: '1px solid var(--surface-200)' }}>
          <FaArrowRight /> العودة لقائمة التقارير
        </button>
      )}

      <div className="row g-3">
        {employees.slice(0, 3).map((emp: any, index: number) => (
          <motion.div key={emp.id} className="col-md-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
            <div className="card text-white h-100" style={{ 
              borderRadius: '16px', 
              background: index === 0 ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' :
                          index === 1 ? 'linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)' :
                          'linear-gradient(135deg, #f39c12 0%, #f1c40f 100%)'
            }}>
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div>
                    <h6 className="mb-1">{emp.name}</h6>
                    <small style={{ opacity: 0.8 }}>{emp.role}</small>
                  </div>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FaUser />
                  </div>
                </div>
                <div className="row text-center">
                  <div className="col-4">
                    <h5 className="fw-bold mb-0">{emp.completedOrders}</h5>
                    <small style={{ opacity: 0.8, fontSize: '11px' }}>مكتمل</small>
                  </div>
                  <div className="col-4">
                    <h5 className="fw-bold mb-0">{emp.pendingOrders}</h5>
                    <small style={{ opacity: 0.8, fontSize: '11px' }}>معلق</small>
                  </div>
                  <div className="col-4">
                    <h5 className="fw-bold mb-0">{emp.efficiency}%</h5>
                    <small style={{ opacity: 0.8, fontSize: '11px' }}>كفاءة</small>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}

        <div className="col-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="card" style={{ borderRadius: '16px', overflow: 'hidden' }}>
            <div className="card-header bg-white border-0 pt-4 px-4">
              <h5 className="fw-bold mb-0">تفاصيل إنتاجية الموظفين</h5>
            </div>
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead>
                  <tr style={{ backgroundColor: 'var(--surface-50)', fontSize: '12px' }}>
                    <th className="px-4 py-3">الموظف</th>
                    <th className="px-4 py-3">الدور</th>
                    <th className="px-4 py-3">الأوامر المكتملة</th>
                    <th className="px-4 py-3">الأوامر المعلقة</th>
                    <th className="px-4 py-3">المتوسط اليومي</th>
                    <th className="px-4 py-3">نسبة الكفاءة</th>
                    <th className="px-4 py-3">التقييم</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp: any, index: number) => {
                    const badge = getEfficiencyBadge(emp.efficiency);
                    return (
                      <motion.tr key={emp.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + index * 0.1 }}>
                        <td className="px-4 py-3 fw-semibold">{emp.name}</td>
                        <td className="px-4 py-3"><span className="badge bg-light text-dark">{emp.role}</span></td>
                        <td className="px-4 py-3"><FaCheckCircle className="me-1" style={{ color: 'var(--accent-green)' }} />{emp.completedOrders}</td>
                        <td className="px-4 py-3">{emp.pendingOrders}</td>
                        <td className="px-4 py-3 fw-semibold">{emp.dailyAverage} / يوم</td>
                        <td className="px-4 py-3">
                          <div className="d-flex align-items-center gap-2">
                            <div className="progress flex-grow-1" style={{ height: '8px', borderRadius: '4px' }}>
                              <motion.div initial={{ width: 0 }} animate={{ width: `${emp.efficiency}%` }} transition={{ duration: 1 }}
                                className="progress-bar" style={{ backgroundColor: getEfficiencyColor(emp.efficiency), borderRadius: '4px' }} />
                            </div>
                            <span style={{ fontSize: '13px' }}>{emp.efficiency}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3"><span className={`badge ${badge.class}`}>{badge.text}</span></td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaUser, FaEdit, FaTrash, FaPlus, FaEye, FaArrowRight } from 'react-icons/fa';
import StatusBadge from '@/components/ui/StatusBadge';

interface AuditLogReportProps {
  dateRange: string;
  onBack?: () => void;
}

const getActionIcon = (action: string) => {
  if (action.includes('إنشاء')) return <FaPlus style={{ color: '#4a7c59' }} />;
  if (action.includes('تعديل') || action.includes('تحديث')) return <FaEdit style={{ color: '#3b82f6' }} />;
  if (action.includes('حذف')) return <FaTrash style={{ color: '#e74c3c' }} />;
  if (action.includes('عرض')) return <FaEye style={{ color: '#8b5cf6' }} />;
  return <FaUser style={{ color: '#6b6b6b' }} />;
};

const getActionBadge = (action: string) => {
  if (action.includes('إنشاء')) return { status: 'completed' as const, text: action };
  if (action.includes('تعديل') || action.includes('تحديث')) return { status: 'processing' as const, text: action };
  if (action.includes('حذف')) return { status: 'cancelled' as const, text: action };
  return { status: 'received' as const, text: action };
};

export default function AuditLogReport({ dateRange, onBack }: AuditLogReportProps) {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/reports/audit-log');
      setLogs(await res.json());
    } catch {} finally { setIsLoading(false); }
  };

  if (isLoading) return <div className="text-center py-5"><div className="spinner-border text-success" /><p className="mt-2 text-muted">جاري التحميل...</p></div>;

  return (
    <div>
      {onBack && <button onClick={onBack} className="btn btn-light mb-3 d-flex align-items-center gap-2" style={{ borderRadius: 10, border: '1px solid #e8e8e8' }}><FaArrowRight /> العودة لقائمة التقارير</button>}

      <div className="card" style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid #e8e8e8' }}>
        <div className="card-header bg-white border-0 pt-4 px-4"><h5 className="fw-bold mb-0" style={{ color: '#1a1a1a' }}>سجل التدقيق - من قام بأي عملية ومتى</h5></div>
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead><tr style={{ backgroundColor: '#fafafa', fontSize: 12 }}><th className="px-4 py-3">المستخدم</th><th className="px-4 py-3">الإجراء</th><th className="px-4 py-3">الكيان</th><th className="px-4 py-3">التفاصيل</th><th className="px-4 py-3">التاريخ والوقت</th><th className="px-4 py-3">IP</th></tr></thead>
            <tbody>
              {logs.length === 0 ? <tr><td colSpan={6} className="text-center py-4 text-muted">لا يوجد سجل تدقيق</td></tr> :
                logs.map((log: any, i: number) => {
                  const badge = getActionBadge(log.action);
                  return (
                    <motion.tr key={log.id || i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                      <td className="px-4 py-3 fw-semibold" style={{ fontSize: 13 }}>{log.user}</td>
                      <td className="px-4 py-3"><div className="d-flex align-items-center gap-2">{getActionIcon(log.action)} <StatusBadge status={badge.status} text={badge.text} /></div></td>
                      <td className="px-4 py-3" style={{ fontSize: 13 }}>{log.entity}</td>
                      <td className="px-4 py-3 text-muted" style={{ fontSize: 12, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.details}</td>
                      <td className="px-4 py-3"><code style={{ fontSize: 11, backgroundColor: '#f5f5f5', padding: '4px 8px', borderRadius: 6 }}>{log.timestamp}</code></td>
                      <td className="px-4 py-3"><small className="text-muted">{log.ip}</small></td>
                    </motion.tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
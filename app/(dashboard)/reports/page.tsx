'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaChartBar, 
  FaChartLine, 
  FaChartPie,
  FaBox,
  FaExclamationTriangle,
  FaDollarSign,
  FaUser,
  FaClock,
  FaTruck,
  FaTrash,
  FaCalendar,
  FaDownload,
  FaPrint
} from 'react-icons/fa';
import InventoryValueReport from './components/InventoryValueReport';
import SalesVelocityReport from './components/SalesVelocityReport';
import EmployeeProductivityReport from './components/EmployeeProductivityReport';
import PendingOrdersReport from './components/PendingOrdersReport';
import AuditLogReport from './components/AuditLogReport';
import ExpiryReport from './components/ExpiryReport';
import LogisticsCostReport from './components/LogisticsCostReport';
import LossReport from './components/LossReport';

// Report categories
const reportCategories = [
  {
    id: 'inventory',
    title: 'تقارير المخزون',
    icon: <FaBox />,
    reports: [
      { id: 'inventory-value', title: 'قيمة المخزون الحالي', desc: 'الأصول المجمدة في المستودع', icon: <FaDollarSign /> },
      { id: 'sales-velocity', title: 'سرعة بيع المنتجات', desc: 'الأكثر مبيعاً مقابل الراكد', icon: <FaChartLine /> },
    ]
  },
  {
    id: 'operations',
    title: 'تقارير العمليات',
    icon: <FaTruck />,
    reports: [
      { id: 'employee-productivity', title: 'إنتاجية الموظفين', desc: 'عدد الأوامر المنجزة لكل عامل', icon: <FaUser /> },
      { id: 'pending-orders', title: 'المهام المعلقة', desc: 'أوامر الاستلام التي لم تصل', icon: <FaClock /> },
    ]
  },
  {
    id: 'monitoring',
    title: 'تقارير المراقبة',
    icon: <FaExclamationTriangle />,
    reports: [
      { id: 'audit-log', title: 'سجل التدقيق', desc: 'من قام بأي عملية ومتى', icon: <FaChartBar /> },
      { id: 'expiry', title: 'صلاحية المنتجات', desc: 'المنتجات التي قاربت على الانتهاء', icon: <FaCalendar /> },
    ]
  },
  {
    id: 'financial',
    title: 'تقارير مالية',
    icon: <FaChartPie />,
    reports: [
      { id: 'logistics-cost', title: 'التكاليف اللوجستية', desc: 'نقل - تخزين - استلام', icon: <FaTruck /> },
      { id: 'loss', title: 'تقرير الخسائر', desc: 'منتجات تالفة ومنتهية الصلاحية', icon: <FaTrash /> },
    ]
  },
];

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState('month');

  const renderReport = () => {
    if (!selectedReport) return null;

    switch (selectedReport) {
      case 'inventory-value':
        return <InventoryValueReport dateRange={dateRange} />;
      case 'sales-velocity':
        return <SalesVelocityReport dateRange={dateRange} />;
      case 'employee-productivity':
        return <EmployeeProductivityReport dateRange={dateRange} />;
      case 'pending-orders':
        return <PendingOrdersReport dateRange={dateRange} />;
      case 'audit-log':
        return <AuditLogReport dateRange={dateRange} />;
      case 'expiry':
        return <ExpiryReport dateRange={dateRange} />;
      case 'logistics-cost':
        return <LogisticsCostReport dateRange={dateRange} />;
      case 'loss':
        return <LossReport dateRange={dateRange} />;
      default:
        return null;
    }
  };

  const getReportTitle = () => {
    for (const category of reportCategories) {
      const report = category.reports.find(r => r.id === selectedReport);
      if (report) return report.title;
    }
    return '';
  };

  return (
    <div>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="d-flex justify-content-between align-items-center mb-4"
      >
        <div>
          <h2 className="fw-bold mb-1" style={{ color: 'var(--surface-900)' }}>التقارير والتحليلات</h2>
          <p className="text-muted mb-0" style={{ fontSize: '14px' }}>
            تحليلات شاملة عن حالة المستودع والمخزون
          </p>
        </div>
        {selectedReport && (
          <div className="d-flex gap-2 align-items-center">
            <select 
              className="form-select"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              style={{ 
                borderRadius: '10px', 
                border: '1px solid var(--surface-200)',
                fontSize: '14px',
                width: 'auto',
              }}
            >
              <option value="week">آخر أسبوع</option>
              <option value="month">آخر شهر</option>
              <option value="quarter">آخر 3 أشهر</option>
              <option value="year">آخر سنة</option>
            </select>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn btn-outline-primary d-flex align-items-center gap-2"
              style={{ borderRadius: '10px' }}
            >
              <FaDownload size={14} />
              تصدير
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn btn-outline-secondary d-flex align-items-center gap-2"
              style={{ borderRadius: '10px' }}
            >
              <FaPrint size={14} />
              طباعة
            </motion.button>
          </div>
        )}
      </motion.div>

      {!selectedReport ? (
        /* Report Selection Grid */
        <div className="row g-4">
          {reportCategories.map((category, catIndex) => (
            <motion.div
              key={category.id}
              className="col-md-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: catIndex * 0.1 }}
            >
              <div className="card h-100" style={{ borderRadius: '16px' }}>
                <div className="card-header bg-white border-0 pt-4 px-4">
                  <h5 className="fw-bold mb-0 d-flex align-items-center gap-2">
                    <span style={{ color: 'var(--primary-600)' }}>{category.icon}</span>
                    {category.title}
                  </h5>
                </div>
                <div className="card-body pt-0 px-4">
                  <div className="d-flex flex-column gap-2">
                    {category.reports.map((report) => (
                      <motion.button
                        key={report.id}
                        whileHover={{ scale: 1.02, x: -4 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedReport(report.id)}
                        style={{
                          borderRadius: '12px',
                          padding: '16px',
                          border: '1px solid var(--surface-200)',
                          backgroundColor: 'white',
                          cursor: 'pointer',
                          width: '100%',
                          textAlign: 'right',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--surface-50)';
                          e.currentTarget.style.borderColor = 'var(--primary-300)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'white';
                          e.currentTarget.style.borderColor = 'var(--surface-200)';
                        }}
                      >
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '10px',
                          backgroundColor: 'var(--primary-50)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--primary-600)',
                          fontSize: '18px',
                          flexShrink: 0,
                        }}>
                          {report.icon}
                        </div>
                        <div>
                          <h6 className="mb-1 fw-semibold">{report.title}</h6>
                          <small className="text-muted">{report.desc}</small>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        /* Report View */
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedReport}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="mb-4">
              <button
                onClick={() => setSelectedReport(null)}
                className="btn btn-light mb-3"
                style={{ borderRadius: '10px' }}
              >
                ← العودة لقائمة التقارير
              </button>
              <h4 className="fw-bold">{getReportTitle()}</h4>
            </div>
            {renderReport()}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
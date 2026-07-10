'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import StatCard from '@/components/ui/StatCard';
import { useRouter } from 'next/navigation';
import { 
  FaBox, 
  FaTruck, 
  FaExclamationTriangle, 
  FaDollarSign,
  FaChartLine,
  FaClipboardList,
  FaWarehouse 
} from 'react-icons/fa';

interface DashboardStats {
  totalProducts: number;
  activeWarehouses: number;
  todayOrders: number;
  lowStockCount: number;
  totalInventoryValue: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    activeWarehouses: 0,
    todayOrders: 0,
    lowStockCount: 0,
    totalInventoryValue: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('/api/dashboard/stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number | undefined) => {
    if (value === undefined || value === null) return '$0';
    return `$${value.toLocaleString('en-US')}`;
  };

  const statCards = [
    { title: 'إجمالي المنتجات', value: stats.totalProducts, icon: <FaBox />, color: 'primary' as const },
    { title: 'المستودعات النشطة', value: stats.activeWarehouses, icon: <FaWarehouse />, color: 'info' as const },
    { title: 'أوامر اليوم', value: stats.todayOrders, icon: <FaClipboardList />, color: 'success' as const },
    { title: 'تنبيهات المخزون', value: stats.lowStockCount, icon: <FaExclamationTriangle />, color: 'warning' as const },
    { title: 'قيمة المخزون', value: formatCurrency(stats.totalInventoryValue), icon: <FaDollarSign />, color: 'success' as const },
  ];

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1" style={{ color: '#0f172a' }}>لوحة التحكم</h2>
          <p className="text-muted mb-0" style={{ fontSize: 14 }}>نظرة عامة على حالة المستودع اليوم</p>
        </div>
        <div className="d-flex gap-2">
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            className="btn btn-primary d-flex align-items-center gap-2" style={{ borderRadius: 10, padding: '10px 20px' }}
            onClick={() => router.push('/orders?type=inbound')}>
            <FaTruck /> أمر استلام جديد
          </motion.button>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            className="btn btn-success d-flex align-items-center gap-2" style={{ borderRadius: 10, padding: '10px 20px' }}
            onClick={() => router.push('/orders?type=outbound')}>
            <FaClipboardList /> أمر تجهيز جديد
          </motion.button>
        </div>
      </motion.div>

      <div className="row g-3 mb-4">
        {statCards.map((stat, index) => (
          <motion.div key={index} className="col-md-4 col-lg-2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
            <StatCard {...stat} />
          </motion.div>
        ))}
      </div>

      {isLoading && (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" /><p className="mt-2 text-muted">جاري تحميل البيانات...</p>
        </div>
      )}
    </div>
  );
}
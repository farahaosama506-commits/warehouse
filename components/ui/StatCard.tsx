'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
}

const colorClasses = {
  primary: {
    bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  success: {
    bg: 'linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)',
  },
  warning: {
    bg: 'linear-gradient(135deg, #f39c12 0%, #f1c40f 100%)',
  },
  danger: {
    bg: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
  },
  info: {
    bg: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
  },
};

export default function StatCard({ title, value, icon, trend, color = 'primary' }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -5, boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}
      className="card text-white border-0 overflow-hidden"
      style={{
        background: colorClasses[color].bg,
        borderRadius: '16px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
        transition: 'all 0.3s ease',
      }}
    >
      <div className="card-body p-4">
        <div className="d-flex justify-content-between align-items-start mb-3">
          <span className="opacity-75" style={{ fontSize: '0.875rem' }}>
            {title}
          </span>
          <motion.div
            whileHover={{ rotate: 15, scale: 1.1 }}
            transition={{ type: 'spring', stiffness: 300 }}
            style={{ fontSize: '1.5rem', opacity: 0.9 }}
          >
            {icon}
          </motion.div>
        </div>
        <motion.h3 
          className="mb-1 fw-bold"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          style={{ fontSize: '2rem' }}
        >
          {value}
        </motion.h3>
        {trend && (
          <small className="opacity-75 d-flex align-items-center gap-1">
            <span>{trend.isPositive ? '↑' : '↓'}</span>
            {trend.value}
          </small>
        )}
      </div>
    </motion.div>
  );
}
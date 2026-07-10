'use client';

import { motion } from 'framer-motion';

interface StatusBadgeProps {
  status: 'pending' | 'processing' | 'completed' | 'cancelled' | 'shipped' | 'received';
  text: string;
}

const statusConfig = {
  pending: { bg: '#fff3cd', text: '#856404', dot: '#f59e0b' },
  processing: { bg: '#cce5ff', text: '#004085', dot: '#3b82f6' },
  completed: { bg: '#d4edda', text: '#155724', dot: '#10b981' },
  cancelled: { bg: '#f8d7da', text: '#721c24', dot: '#ef4444' },
  shipped: { bg: '#e8daef', text: '#6c3483', dot: '#8b5cf6' },
  received: { bg: '#d1ecf1', text: '#0c5460', dot: '#06b6d4' },
};

export default function StatusBadge({ status, text }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <motion.span
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      style={{
        backgroundColor: config.bg,
        color: config.text,
      }}
      className="badge d-inline-flex align-items-center gap-2 px-3 py-2 rounded-pill"
    >
      <span 
        className="status-dot"
        style={{ 
          width: '8px', 
          height: '8px', 
          borderRadius: '50%', 
          backgroundColor: config.dot,
          display: 'inline-block',
          animation: 'pulse 2s infinite'
        }} 
      />
      {text}
    </motion.span>
  );
}
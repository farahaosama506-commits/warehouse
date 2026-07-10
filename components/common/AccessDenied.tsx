'use client';

import { motion } from 'framer-motion';
import { FaLock } from 'react-icons/fa';

export default function AccessDenied() {
  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: '#f8fafc' }}>
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} className="text-center">
        <div style={{ fontSize: 80, color: '#e2e8f0', marginBottom: 20 }}>
          <FaLock />
        </div>
        <h2 className="fw-bold mb-3" style={{ color: '#0f172a' }}>عذراً، أنت غير مخول للدخول إلى هنا</h2>
        <p className="text-muted mb-4">لا تمتلك الصلاحيات الكافية للوصول إلى هذه الصفحة. يرجى التواصل مع مدير النظام.</p>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          className="btn btn-primary" style={{ borderRadius: 10, padding: '10px 30px' }}
          onClick={() => window.location.href = '/dashboard'}>
          العودة للوحة التحكم
        </motion.button>
      </motion.div>
    </div>
  );
}
'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { motion } from 'framer-motion';
import { FaWarehouse, FaEnvelope, FaLock } from 'react-icons/fa';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(email, password);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else if (result.success) {
      window.location.href = '/dashboard';
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="container">
        <div className="row justify-content-center">
          <div className="col-md-5 col-lg-4">
            <div className="card shadow-lg border-0" style={{ borderRadius: 20 }}>
              <div className="card-body p-5">
                <div className="text-center mb-4">
                  <FaWarehouse style={{ fontSize: '3rem', color: '#444ce7' }} />
                  <h3 className="mt-3 mb-2 fw-bold">نظام إدارة المستودعات</h3>
                  <p className="text-muted">تسجيل الدخول</p>
                </div>

                {error && <div className="alert alert-danger text-center">{error}</div>}

                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">البريد الإلكتروني</label>
                    <div className="input-group">
                      <span className="input-group-text"><FaEnvelope /></span>
                      <input type="text" className="form-control" placeholder="admin@warehouse.com" value={email} onChange={e => setEmail(e.target.value)} required />
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="form-label fw-semibold">كلمة المرور</label>
                    <div className="input-group">
                      <span className="input-group-text"><FaLock /></span>
                      <input type="password" className="form-control" placeholder="كلمة المرور" value={password} onChange={e => setPassword(e.target.value)} required />
                    </div>
                  </div>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" className="btn btn-primary w-100 py-2" style={{ borderRadius: 12, fontWeight: 600 }} disabled={loading}>
                    {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
                  </motion.button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSearch, FaBell, FaUser, FaSignOutAlt, FaBars } from 'react-icons/fa';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

interface NavbarProps {
  onMenuClick?: () => void;
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notificationCount, setNotificationCount] = useState(0);

  const getRoleName = (role: string) => {
    const roles: any = { general_manager: 'مدير عام', warehouse_supervisor: 'مشرف مستودع', warehouse_worker: 'عامل مستودع', system_admin: 'مدير نظام', investor: 'مستثمر' };
    return roles[role] || '';
  };

  const handleNotificationsClick = () => {
    setShowNotifications(!showNotifications);
    setShowUserMenu(false);
  };

  const handleUserMenuClick = () => {
    setShowUserMenu(!showUserMenu);
    setShowNotifications(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const q = searchQuery.trim();
    if (q.startsWith('IN-') || q.startsWith('OUT-') || q.startsWith('TR-') || q.startsWith('ORD-')) {
      router.push(`/orders?search=${q}`);
    } else if (/^\d+$/.test(q)) {
      router.push(`/products?search=${q}`);
    } else {
      router.push(`/products?search=${q}`);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications/check');
      const data = await res.json();
      setNotifications(data.notifications || []);
      setNotificationCount(data.totalAlerts || 0);
    } catch {}
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <nav style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e8e8e8', padding: '0 16px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 30 }}>
        <button onClick={onMenuClick} className="mobile-menu-btn" style={{ display: 'none', background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#4a4a4a', padding: 8, borderRadius: 8 }}><FaBars /></button>

        <form onSubmit={handleSearch} style={{ position: 'relative', width: 400, maxWidth: '100%' }}>
          <FaSearch style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: '#b0b0b0', fontSize: 14 }} />
          <input type="text" placeholder="بحث عن منتج، أمر، عميل..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '10px 40px 10px 16px', border: '1.5px solid #e8e8e8', borderRadius: 10, backgroundColor: '#fafafa', fontSize: 14, outline: 'none', transition: 'border-color 0.2s' }}
            onFocus={e => e.target.style.borderColor = '#4a7c59'} onBlur={e => e.target.style.borderColor = '#e8e8e8'} />
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Notifications */}
          <div style={{ position: 'relative' }}>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleNotificationsClick}
              style={{ width: 40, height: 40, borderRadius: 10, border: '1.5px solid #e8e8e8', backgroundColor: showNotifications ? '#f5f5f5' : '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative' }}>
              <FaBell style={{ color: '#4a4a4a', fontSize: 16 }} />
              {notificationCount > 0 && (
                <span style={{ position: 'absolute', top: -4, right: -4, minWidth: 20, height: 20, backgroundColor: '#e74c3c', borderRadius: '50%', color: 'white', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, padding: '0 5px' }}>{notificationCount}</span>
              )}
            </motion.button>

            <AnimatePresence>
              {showNotifications && (
                <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  style={{ position: 'absolute', top: 48, left: 0, width: 380, maxWidth: '90vw', backgroundColor: '#ffffff', borderRadius: 12, boxShadow: '0 20px 40px rgba(0,0,0,0.12)', border: '1px solid #e8e8e8', overflow: 'hidden', zIndex: 50 }}>
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h6 style={{ margin: 0, fontWeight: 600, color: '#1a1a1a' }}>الإشعارات الذكية</h6>
                    {notificationCount > 0 && <span className="badge" style={{ backgroundColor: '#e74c3c', color: 'white', fontSize: 11 }}>{notificationCount} جديد</span>}
                  </div>
                  <div style={{ maxHeight: 360, overflowY: 'auto' }}>
                    {notifications.length === 0 ? (
                      <div style={{ padding: '40px 16px', textAlign: 'center' }}>
                        <FaBell size={36} style={{ color: '#d4d4d4', marginBottom: 12 }} />
                        <p style={{ color: '#8a8a8a', fontSize: 14, margin: 0 }}>لا توجد إشعارات حالياً</p>
                        <p style={{ color: '#b0b0b0', fontSize: 12, margin: '4px 0 0' }}>كل شيء يسير بشكل طبيعي</p>
                      </div>
                    ) : (
                      notifications.map((n: any, i: number) => (
                        <div key={i} style={{ padding: '14px 20px', borderBottom: '1px solid #f5f5f5', cursor: 'pointer', transition: 'background 0.15s' }}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fafafa'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                          <div style={{ display: 'flex', gap: 12 }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', marginTop: 5, flexShrink: 0, backgroundColor: n.severity === 'danger' ? '#e74c3c' : n.severity === 'warning' ? '#f59e0b' : '#4a7c59' }} />
                            <div>
                              <p style={{ margin: 0, fontWeight: 500, fontSize: 13, color: '#1a1a1a' }}>{n.title}</p>
                              <p style={{ margin: '3px 0', fontSize: 12, color: '#6b6b6b' }}>{n.message}</p>
                              <span className="badge" style={{ fontSize: 10, backgroundColor: n.type === 'low_stock' ? '#fef2f2' : n.type === 'expiry' ? '#fffbeb' : n.type === 'behavior' ? '#f0fdf4' : '#f0fdf4', color: n.type === 'low_stock' ? '#dc2626' : n.type === 'expiry' ? '#d97706' : n.type === 'behavior' ? '#4a7c59' : '#16a34a' }}>
                                {n.type === 'low_stock' ? 'مخزون' : n.type === 'expiry' ? 'صلاحية' : n.type === 'behavior' ? 'سلوك' : 'نظام'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User Menu */}
          <div style={{ position: 'relative' }}>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleUserMenuClick}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 12px', borderRadius: 10, border: '1.5px solid #e8e8e8', backgroundColor: showUserMenu ? '#f5f5f5' : '#ffffff', cursor: 'pointer' }}>
              <div style={{ width: 32, height: 32, backgroundColor: '#4a7c59', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 14, fontWeight: 600 }}>
                {user?.full_name?.charAt(0) || 'م'}
              </div>
              <div className="d-none d-md-block" style={{ textAlign: 'right' }}>
                <p style={{ margin: 0, fontWeight: 500, fontSize: 14, color: '#1a1a1a' }}>{user?.full_name || 'مستخدم'}</p>
                <p style={{ margin: 0, fontSize: 12, color: '#8a8a8a' }}>{getRoleName(user?.role || '')}</p>
              </div>
            </motion.button>

            <AnimatePresence>
              {showUserMenu && (
                <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  style={{ position: 'absolute', top: 52, left: 0, width: 200, backgroundColor: '#ffffff', borderRadius: 12, boxShadow: '0 20px 40px rgba(0,0,0,0.12)', border: '1px solid #e8e8e8', overflow: 'hidden', zIndex: 50 }}>
                  <div style={{ padding: 8 }}>
                    <button style={{ width: '100%', padding: '10px 12px', background: 'none', border: 'none', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#e74c3c', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fef2f2'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                      onClick={() => { setShowUserMenu(false); setShowLogoutConfirm(true); }}>
                      <FaSignOutAlt size={14} /> تسجيل الخروج
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </nav>

      <ConfirmDialog isOpen={showLogoutConfirm} onClose={() => setShowLogoutConfirm(false)} onConfirm={() => { setShowLogoutConfirm(false); logout(); }}
        title="تسجيل الخروج" message="هل أنت متأكد من تسجيل الخروج؟" confirmText="تسجيل الخروج" type="warning" />
    </>
  );
}
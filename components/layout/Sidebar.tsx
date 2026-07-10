'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { motion } from 'framer-motion';
import { 
  FaHome, FaBox, FaFileAlt, FaChartBar, FaUsers, FaUserTie,
  FaChevronLeft, FaChevronRight, FaCog, FaSignOutAlt, FaWarehouse,
  FaBars, FaTimes,
} from 'react-icons/fa';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

const menuItems = [
  { href: '/dashboard', icon: <FaHome size={16} />, label: 'لوحة التحكم' },
  { href: '/products', icon: <FaBox size={16} />, label: 'المنتجات' },
  { href: '/warehouse', icon: <FaWarehouse size={16} />, label: 'المستودعات' },
  { href: '/orders', icon: <FaFileAlt size={16} />, label: 'الأوامر والحركات' },
  { href: '/reports', icon: <FaChartBar size={16} />, label: 'التقارير' },
  { href: '/users', icon: <FaUsers size={16} />, label: 'المستخدمين' },
  { href: '/customers', icon: <FaUserTie size={16} />, label: 'العملاء' },
];

interface SidebarProps {
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function Sidebar({ isMobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const getRoleName = (role: string) => {
    const roles: any = { general_manager: 'مدير عام', warehouse_supervisor: 'مشرف مستودع', warehouse_worker: 'عامل مستودع', system_admin: 'مدير نظام', investor: 'مستثمر' };
    return roles[role] || '';
  };

  const filteredMenuItems = menuItems.filter(item => {
    const mod = item.href === '/dashboard' ? 'dashboard' : item.href === '/products' ? 'products' : item.href === '/warehouse' ? 'warehouses' : item.href === '/orders' ? 'orders' : item.href === '/reports' ? 'reports' : item.href === '/users' ? 'users' : item.href === '/customers' ? 'customers' : 'settings';
    return user?.permissions[mod]?.can_view;
  });

  return (
    <>
      <motion.aside
        animate={{ width: isCollapsed ? 72 : 260 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        className="sidebar"
        style={{
          height: '100vh', backgroundColor: '#ffffff', color: '#1a1a1a',
          display: 'flex', flexDirection: 'column', position: 'fixed', right: 0, top: 0, zIndex: 40,
          borderLeft: '1px solid #e8e8e8', overflowY: 'auto', overflowX: 'hidden',
        }}
      >
        {/* Logo */}
        <div style={{ padding: '20px 16px', borderBottom: '1px solid #f0f0f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {(!isCollapsed || isMobileOpen) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, backgroundColor: '#4a7c59', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <FaWarehouse style={{ color: 'white', fontSize: 16 }} />
                </div>
                <span style={{ fontWeight: 600, fontSize: 15, whiteSpace: 'nowrap', color: '#1a1a1a' }}>نظام المستودعات</span>
              </div>
            )}
            {isMobileOpen ? (
              <button onClick={onMobileClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 6, color: '#6b6b6b' }}><FaTimes size={16} /></button>
            ) : (
              <button onClick={() => setIsCollapsed(!isCollapsed)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 6, color: '#6b6b6b' }}>
                {isCollapsed ? <FaChevronRight size={14} /> : <FaChevronLeft size={14} />}
              </button>
            )}
          </div>
        </div>

        {/* Menu */}
        <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto' }}>
          {filteredMenuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }} onClick={isMobileOpen ? onMobileClose : undefined}>
                <motion.div whileHover={{ x: -2 }} whileTap={{ scale: 0.98 }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: isCollapsed && !isMobileOpen ? '10px' : '10px 14px',
                    marginBottom: 2, borderRadius: 8, cursor: 'pointer', transition: 'all 0.15s',
                    backgroundColor: isActive ? '#f0f7f1' : 'transparent',
                    color: isActive ? '#4a7c59' : '#4a4a4a',
                    fontWeight: isActive ? 500 : 400, justifyContent: (isCollapsed && !isMobileOpen) ? 'center' : 'flex-start',
                  }}>
                  <span style={{ flexShrink: 0 }}>{item.icon}</span>
                  {(!isCollapsed || isMobileOpen) && <span style={{ fontSize: 14, whiteSpace: 'nowrap' }}>{item.label}</span>}
                </motion.div>
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div style={{ padding: '12px 8px', borderTop: '1px solid #f0f0f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 8, borderRadius: 8, justifyContent: (isCollapsed && !isMobileOpen) ? 'center' : 'flex-start' }}>
            <div style={{ width: 32, height: 32, backgroundColor: '#4a7c59', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 13, fontWeight: 600, flexShrink: 0 }}>
              {user?.full_name?.charAt(0) || 'م'}
            </div>
            {(!isCollapsed || isMobileOpen) && (
              <div style={{ overflow: 'hidden', flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 500, margin: 0, whiteSpace: 'nowrap' }}>{user?.full_name || 'مستخدم'}</p>
                <p style={{ fontSize: 11, color: '#8a8a8a', margin: 0, whiteSpace: 'nowrap' }}>{getRoleName(user?.role || '')}</p>
              </div>
            )}
          </div>
          {(!isCollapsed || isMobileOpen) && (
            <div style={{ marginTop: 6 }}>
              <Link href="/settings" style={{ textDecoration: 'none', color: '#6b6b6b', fontSize: 12, padding: '6px 10px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f5f5f5'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                <FaCog size={12} /> الإعدادات
              </Link>
              <button style={{ width: '100%', padding: '6px 10px', background: 'none', border: 'none', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#e74c3c', transition: 'all 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fef2f2'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                onClick={() => setShowLogoutConfirm(true)}>
                <FaSignOutAlt size={12} /> تسجيل الخروج
              </button>
            </div>
          )}
        </div>
      </motion.aside>

      <ConfirmDialog isOpen={showLogoutConfirm} onClose={() => setShowLogoutConfirm(false)} onConfirm={() => { setShowLogoutConfirm(false); logout(); }}
        title="تسجيل الخروج" message="هل أنت متأكد من تسجيل الخروج؟" confirmText="تسجيل الخروج" type="warning" />
    </>
  );
}
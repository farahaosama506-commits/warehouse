'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import Navbar from '@/components/layout/Navbar';
import AccessDenied from '@/components/common/AccessDenied';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getModuleFromPath = (path: string): string => {
    if (path.startsWith('/dashboard')) return 'dashboard';
    if (path.startsWith('/products')) return 'products';
    if (path.startsWith('/orders')) return 'orders';
    if (path.startsWith('/warehouse')) return 'warehouses';
    if (path.startsWith('/reports')) return 'reports';
    if (path.startsWith('/users')) return 'users';
    if (path.startsWith('/customers')) return 'customers';
    if (path.startsWith('/settings')) return 'settings';
    return 'dashboard';
  };

  if (isLoading) {
    return <div className="min-vh-100 d-flex align-items-center justify-content-center"><div className="spinner-border text-success" /></div>;
  }

  if (!user) {
    if (typeof window !== 'undefined') window.location.replace('/login');
    return null;
  }

  const module = getModuleFromPath(pathname);
  const hasAccess = user.permissions[module]?.can_view;

  if (!hasAccess) return <AccessDenied />;

  return (
    <div className="d-flex" style={{ minHeight: '100vh', backgroundColor: '#fafafa' }}>
      <div className={`sidebar-overlay ${mobileMenuOpen ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)} />
      <div className={`sidebar ${mobileMenuOpen ? 'open' : ''}`}>
        <Sidebar isMobileOpen={mobileMenuOpen} onMobileClose={() => setMobileMenuOpen(false)} />
      </div>
      <div className="flex-grow-1 d-flex flex-column main-content" style={{ marginRight: 260, transition: 'margin 0.25s ease' }}>
        <Navbar onMenuClick={() => setMobileMenuOpen(true)} />
        <main className="flex-grow-1 p-4">{children}</main>
      </div>
    </div>
  );
}
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';

interface User {
  id: string;
  full_name: string;
  username: string;
  role: string;
  permissions: { [module: string]: { can_view: boolean; can_create: boolean; can_edit: boolean; can_delete: boolean } };
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ error?: string; success?: boolean }>;
  logout: () => void;
  hasPermission: (module: string, action: 'view' | 'create' | 'edit' | 'delete') => boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null, isLoading: true,
  login: async () => ({}),
  logout: () => {},
  hasPermission: () => false,
});

export function useAuth() { return useContext(AuthContext); }

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

 const fetchPermissions = async (role: string): Promise<User['permissions']> => {
    try {
      const { data, error } = await supabase
        .from('permissions')
        .select('*')
        .eq('role_name', role);

      if (error) {
        console.error('Error fetching permissions:', error);
        return {};
      }

      const perms: User['permissions'] = {};
      data?.forEach((p: any) => {
        perms[p.module] = {
          can_view: p.can_view,
          can_create: p.can_create,
          can_edit: p.can_edit,
          can_delete: p.can_delete,
        };
      });

      console.log('Fetched permissions for role', role, ':', perms);
      return perms;
    } catch {
      return {};
    }
  };

 useEffect(() => {
    const initAuth = async () => {
      try {
        const savedUser = localStorage.getItem('warehouse_user');
        if (savedUser) {
          const parsed = JSON.parse(savedUser);
          const perms = await fetchPermissions(parsed.role);
          setUser({ ...parsed, permissions: perms });
          console.log('Restored permissions:', perms); // للتأكد
        }
      } catch {} 
      finally { setIsLoading(false); }
    };
    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const result = await res.json();

    if (res.status === 429) {
      return { error: result.error };
    }

    if (!res.ok || result.error) {
      return { error: result.error || 'بيانات الدخول غير صحيحة' };
    }

    const userData = result.user;
    const perms = await fetchPermissions(userData.role);

    const fullUser = { ...userData, permissions: perms };
    localStorage.setItem('warehouse_user', JSON.stringify(fullUser));
    setUser(fullUser);

    return { success: true };
  } catch {
    return { error: 'حدث خطأ أثناء تسجيل الدخول' };
  }
};

  const logout = () => {
    setUser(null);
    localStorage.removeItem('warehouse_user');
    window.location.href = '/login';
  };

  const hasPermission = (module: string, action: 'view' | 'create' | 'edit' | 'delete') => {
    if (!user) return false;
    const perm = user.permissions[module];
    if (!perm) return false;
    const actionMap = { view: 'can_view', create: 'can_create', edit: 'can_edit', delete: 'can_delete' } as const;
    return perm[actionMap[action]];
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}
'use client';

import { useState, useEffect, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaPlus, 
  FaEdit, 
  FaSearch, 
  FaUser,
  FaUserShield,
  FaUserCog,
  FaUserTie,
  FaKey,
  FaPhone,
  FaEnvelope,
  FaShieldAlt,
  FaToggleOn,
  FaToggleOff,
  FaTrash,
} from 'react-icons/fa';
import StatusBadge from '@/components/ui/StatusBadge';
import Modal from '@/components/ui/Modal';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/lib/toast-context';


type UserRole = 'general_manager' | 'warehouse_supervisor' | 'warehouse_worker' | 'system_admin' | 'investor';

interface User {
  id: string;
  full_name: string;
  username: string;
  phone: string;
  role: UserRole;
  is_active: boolean;
  last_login: string | null;
  created_at: string;
}



const formatDate = (dateStr: string | null) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('ar-SA');
};

const formatDateTime = (dateStr: string | null) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString('ar-SA');
};

export default function UsersPage() {
  const { showToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState({
    full_name: '',
    username: '',
    password_hash: '',
    phone: '',
    role: 'warehouse_worker' as UserRole,
  });

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (filterRole !== 'all') params.append('role', filterRole);
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (searchTerm) params.append('search', searchTerm);

      const response = await fetch(`/api/users?${params.toString()}`);
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  }, [filterRole, filterStatus, searchTerm]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const getRoleInfo = (role: UserRole) => {
    const roleMap: { [key: string]: { text: string; icon: ReactNode; class: string } } = {
      general_manager: { text: 'مدير عام', icon: <FaUserShield />, class: 'bg-primary' },
      warehouse_supervisor: { text: 'مشرف مستودع', icon: <FaUserCog />, class: 'bg-info' },
      warehouse_worker: { text: 'عامل مستودع', icon: <FaUser />, class: 'bg-secondary' },
      system_admin: { text: 'مدير نظام', icon: <FaUserTie />, class: 'bg-success' },
      investor: { text: 'مستثمر', icon: <FaShieldAlt />, class: 'bg-warning text-dark' },
    };
    return roleMap[role] || { text: role, icon: <FaUser />, class: 'bg-secondary' };
  };

 const handleCreateUser = async () => {
  if (!newUser.full_name || !newUser.username || !newUser.password_hash || !newUser.phone) {
    showToast('يرجى ملء الحقول المطلوبة', 'info'); return;
  }
  try {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newUser),
    });

    if (res.ok) {
      setShowAddModal(false);
      setNewUser({ full_name: '', username: '', password_hash: '', phone: '', role: 'warehouse_worker' });
      fetchUsers();
      showToast('تم إضافة المستخدم بنجاح', 'success');
    } else {
      const err = await res.json();
      showToast(err.error || 'حدث خطأ', 'error');
    }
  } catch {
    showToast('حدث خطأ', 'error');
  }
};

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    try {
      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedUser),
      });

      if (response.ok) {
        setShowAddModal(false);
        setSelectedUser(null);
        fetchUsers();
      }
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const handleToggleStatus = async (userId: string) => {
    try {
      await fetch(`/api/users/${userId}/toggle-status`, { method: 'PATCH' });
      fetchUsers();
    } catch (error) {
      console.error('Error toggling status:', error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('هل أنت متأكد من تعطيل هذا المستخدم؟')) return;
    try {
      await fetch(`/api/users/${userId}`, { method: 'DELETE' });
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const roles = [
    { value: 'all', label: 'جميع الأدوار' },
    { value: 'general_manager', label: 'مدير عام' },
    { value: 'warehouse_supervisor', label: 'مشرف مستودع' },
    { value: 'warehouse_worker', label: 'عامل مستودع' },
    { value: 'system_admin', label: 'مدير نظام' },
    { value: 'investor', label: 'مستثمر' },
  ];

  const activeUsers = users.filter(u => u.is_active).length;
  const inactiveUsers = users.filter(u => !u.is_active).length;

  if (isLoading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status" />
        <p className="mt-2 text-muted">جاري تحميل المستخدمين...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="d-flex justify-content-between align-items-center mb-4"
      >
        <div>
          <h2 className="fw-bold mb-1" style={{ color: 'var(--surface-900)' }}>المستخدمين والصلاحيات</h2>
          <p className="text-muted mb-0" style={{ fontSize: '14px' }}>
            إدارة حسابات المستخدمين وصلاحيات الوصول
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="btn btn-primary d-flex align-items-center gap-2"
          style={{ borderRadius: '10px', padding: '10px 20px' }}
          onClick={() => setShowAddModal(true)}
        >
          <FaPlus /> إضافة مستخدم جديد
        </motion.button>
      </motion.div>

      {/* Stats */}
      <div className="row g-3 mb-4">
        <div className="col-md-3 col-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="card text-white" style={{ borderRadius: '16px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <div className="card-body p-3 text-center">
              <FaUser size={24} className="mb-3" />
              <h3 className="fw-bold">{users.length}</h3>
              <small>إجمالي المستخدمين</small>
            </div>
          </motion.div>
        </div>
        <div className="col-md-3 col-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="card text-white" style={{ borderRadius: '16px', background: 'linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)' }}>
            <div className="card-body p-3 text-center">
              <FaToggleOn size={24} className="mb-3" />
              <h3 className="fw-bold">{activeUsers}</h3>
              <small>مستخدمين نشطين</small>
            </div>
          </motion.div>
        </div>
        <div className="col-md-3 col-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="card text-white" style={{ borderRadius: '16px', background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)' }}>
            <div className="card-body p-3 text-center">
              <FaToggleOff size={24} className="mb-3" />
              <h3 className="fw-bold">{inactiveUsers}</h3>
              <small>مستخدمين غير نشطين</small>
            </div>
          </motion.div>
        </div>
        <div className="col-md-3 col-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="card text-white" style={{ borderRadius: '16px', background: 'linear-gradient(135deg, #f39c12 0%, #f1c40f 100%)' }}>
            <div className="card-body p-3 text-center">
              <FaShieldAlt size={24} className="mb-3" />
              <h3 className="fw-bold">{roles.length - 1}</h3>
              <small>أدوار وظيفية</small>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Filters */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="card mb-4" style={{ borderRadius: '16px' }}>
        <div className="card-body p-3">
          <div className="row g-3 align-items-center">
            <div className="col-md-4">
              <div style={{ position: 'relative' }}>
                <FaSearch style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--surface-400)' }} />
                <input type="text" className="form-control" placeholder="بحث بالاسم، اسم المستخدم، أو الهاتف..."
                  value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ padding: '10px 40px 10px 16px', borderRadius: '10px', border: '1px solid var(--surface-200)', fontSize: '14px' }} />
              </div>
            </div>
            <div className="col-md-3">
              <select className="form-select" value={filterRole} onChange={(e) => setFilterRole(e.target.value)}
                style={{ borderRadius: '10px', border: '1px solid var(--surface-200)', fontSize: '14px', padding: '10px 16px' }}>
                {roles.map(role => <option key={role.value} value={role.value}>{role.label}</option>)}
              </select>
            </div>
            <div className="col-md-3">
              <select className="form-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                style={{ borderRadius: '10px', border: '1px solid var(--surface-200)', fontSize: '14px', padding: '10px 16px' }}>
                <option value="all">جميع الحالات</option>
                <option value="active">نشط</option>
                <option value="inactive">غير نشط</option>
              </select>
            </div>
            <div className="col-md-2 text-end">
              <span className="text-muted" style={{ fontSize: '14px' }}>
                عدد المستخدمين: <strong>{users.length}</strong>
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Users Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="card" style={{ borderRadius: '16px', overflow: 'hidden' }}>
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead>
              <tr style={{ backgroundColor: 'var(--surface-50)', fontSize: '12px' }}>
                <th className="px-4 py-3">المستخدم</th>
                <th className="px-4 py-3">اسم المستخدم</th>
                <th className="px-4 py-3">رقم الهاتف</th>
                <th className="px-4 py-3">الدور الوظيفي</th>
                <th className="px-4 py-3">الحالة</th>
                <th className="px-4 py-3">آخر دخول</th>
                <th className="px-4 py-3">تاريخ الإنشاء</th>
                <th className="px-4 py-3">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-4 text-muted">
                      <FaUser size={48} style={{ color: 'var(--surface-300)' }} />
                      <p className="mt-2">لا يوجد مستخدمين</p>
                    </td>
                  </tr>
                ) : (
                  users.map((user, index) => {
                    const roleInfo = getRoleInfo(user.role);
                    return (
                      <motion.tr key={user.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }} transition={{ delay: index * 0.05 }}
                        style={{ opacity: user.is_active ? 1 : 0.6 }}>
                        <td className="px-4 py-3">
                          <div className="d-flex align-items-center gap-2">
                            <div style={{
                              width: '36px', height: '36px', borderRadius: '50%',
                              backgroundColor: user.is_active ? 'var(--primary-100)' : 'var(--surface-200)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: user.is_active ? 'var(--primary-600)' : 'var(--surface-500)',
                              fontSize: '14px', fontWeight: 'bold',
                            }}>
                              {user.full_name?.charAt(0)}
                            </div>
                            <span className="fw-semibold">{user.full_name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <code style={{ fontSize: '13px', backgroundColor: 'var(--surface-100)', padding: '4px 8px', borderRadius: '6px' }}>
                            {user.username}
                          </code>
                        </td>
                        <td className="px-4 py-3">
                          <div className="d-flex align-items-center gap-1">
                            <FaPhone size={12} style={{ color: 'var(--surface-400)' }} />
                            <span style={{ fontSize: '13px' }}>{user.phone}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`badge ${roleInfo.class} d-flex align-items-center gap-1`}
                            style={{ width: 'fit-content', fontSize: '12px', padding: '6px 12px' }}>
                            {roleInfo.icon} {roleInfo.text}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {user.is_active ? (
                            <StatusBadge status="completed" text="نشط" />
                          ) : (
                            <StatusBadge status="cancelled" text="غير نشط" />
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted" style={{ fontSize: '13px' }}>
                          {formatDateTime(user.last_login)}
                        </td>
                        <td className="px-4 py-3 text-muted" style={{ fontSize: '13px' }}>
                          {formatDate(user.created_at)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="d-flex gap-1">
                            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                              className="btn btn-sm btn-outline-primary" style={{ borderRadius: '8px' }} title="تعديل"
                              onClick={() => { setSelectedUser(user); setShowAddModal(true); }}>
                              <FaEdit size={14} />
                            </motion.button>
                            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                              className="btn btn-sm btn-outline-info" style={{ borderRadius: '8px' }} title="الصلاحيات"
                              onClick={() => { setSelectedUser(user); setShowPermissionsModal(true); }}>
                              <FaKey size={14} />
                            </motion.button>
                            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                              className={`btn btn-sm ${user.is_active ? 'btn-outline-warning' : 'btn-outline-success'}`}
                              style={{ borderRadius: '8px' }} title={user.is_active ? 'تعطيل' : 'تفعيل'}
                              onClick={() => handleToggleStatus(user.id)}>
                              {user.is_active ? <FaToggleOn size={14} /> : <FaToggleOff size={14} />}
                            </motion.button>
                            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                              className="btn btn-sm btn-outline-danger" style={{ borderRadius: '8px' }} title="حذف"
                              onClick={() => handleDeleteUser(user.id)}>
                              <FaTrash size={14} />
                            </motion.button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Add/Edit User Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => { setShowAddModal(false); setSelectedUser(null); }}
        title={selectedUser ? 'تعديل مستخدم' : 'إضافة مستخدم جديد'}
        size="lg"
        footer={
          <div className="d-flex justify-content-end gap-2">
            <button className="btn btn-secondary" onClick={() => { setShowAddModal(false); setSelectedUser(null); }} style={{ borderRadius: '10px' }}>إلغاء</button>
            <button className="btn btn-primary" onClick={selectedUser ? handleUpdateUser : handleCreateUser} style={{ borderRadius: '10px' }}>
              {selectedUser ? 'حفظ التعديلات' : 'إضافة المستخدم'}
            </button>
          </div>
        }
      >
        <div className="row">
          <div className="col-md-6 mb-3">
            <label className="form-label fw-semibold">الاسم الكامل</label>
            <input type="text" className="form-control" placeholder="أدخل الاسم الكامل"
              value={selectedUser ? selectedUser.full_name : newUser.full_name}
              onChange={(e) => selectedUser ? setSelectedUser({ ...selectedUser, full_name: e.target.value }) : setNewUser({ ...newUser, full_name: e.target.value })}
              style={{ borderRadius: '10px' }} />
          </div>
          <div className="col-md-6 mb-3">
            <label className="form-label fw-semibold">اسم المستخدم</label>
            <input type="text" className="form-control" placeholder="أدخل اسم المستخدم"
              value={selectedUser ? selectedUser.username : newUser.username}
              onChange={(e) => selectedUser ? setSelectedUser({ ...selectedUser, username: e.target.value }) : setNewUser({ ...newUser, username: e.target.value })}
              style={{ borderRadius: '10px' }} />
          </div>
          <div className="col-md-6 mb-3">
            <label className="form-label fw-semibold">كلمة المرور {selectedUser && '(اتركه فارغاً للإبقاء)'}</label>
            <input type="password" className="form-control" placeholder="أدخل كلمة المرور"
              value={selectedUser ? '' : newUser.password_hash}
              onChange={(e) => !selectedUser && setNewUser({ ...newUser, password_hash: e.target.value })}
              style={{ borderRadius: '10px' }} />
          </div>
          <div className="col-md-6 mb-3">
            <label className="form-label fw-semibold">رقم الهاتف</label>
            <input type="text" className="form-control" placeholder="أدخل رقم الهاتف"
              value={selectedUser ? selectedUser.phone : newUser.phone}
              onChange={(e) => selectedUser ? setSelectedUser({ ...selectedUser, phone: e.target.value }) : setNewUser({ ...newUser, phone: e.target.value })}
              style={{ borderRadius: '10px' }} />
          </div>
          <div className="col-md-6 mb-3">
            <label className="form-label fw-semibold">الدور الوظيفي</label>
            <select className="form-select"
              value={selectedUser ? selectedUser.role : newUser.role}
              onChange={(e) => selectedUser ? setSelectedUser({ ...selectedUser, role: e.target.value as UserRole }) : setNewUser({ ...newUser, role: e.target.value as UserRole })}
              style={{ borderRadius: '10px' }}>
              <option value="general_manager">مدير عام</option>
              <option value="warehouse_supervisor">مشرف مستودع</option>
              <option value="warehouse_worker">عامل مستودع</option>
              <option value="system_admin">مدير نظام</option>
              <option value="investor">مستثمر</option>
            </select>
          </div>
        </div>
      </Modal>

      {/* Permissions Modal */}
      <Modal
        isOpen={showPermissionsModal}
        onClose={() => setShowPermissionsModal(false)}
        title={`صلاحيات المستخدم: ${selectedUser?.full_name}`}
        size="lg"
        footer={
          <div className="d-flex justify-content-end gap-2">
            <button className="btn btn-secondary" onClick={() => setShowPermissionsModal(false)} style={{ borderRadius: '10px' }}>إغلاق</button>
          </div>
        }
      >
        <p className="text-muted mb-3">الصلاحيات محددة حسب الدور الوظيفي: <strong>{selectedUser && getRoleInfo(selectedUser.role).text}</strong></p>
        
        <div className="mb-3">
          <h6 className="fw-bold mb-2">المنتجات</h6>
          <div className="row g-2">
            {['عرض المنتجات', 'إضافة منتج', 'تعديل منتج', 'حذف منتج', 'عرض المخزون', 'تعديل المخزون'].map((perm, i) => (
              <div key={i} className="col-md-6">
                <div className="form-check">
                  <input className="form-check-input" type="checkbox" checked readOnly />
                  <label className="form-check-label" style={{ fontSize: '13px' }}>{perm}</label>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="mb-3">
          <h6 className="fw-bold mb-2">الأوامر</h6>
          <div className="row g-2">
            {['عرض الأوامر', 'إنشاء أمر', 'تعديل أمر', 'حذف أمر', 'الموافقة على الأوامر'].map((perm, i) => (
              <div key={i} className="col-md-6">
                <div className="form-check">
                  <input className="form-check-input" type="checkbox" checked readOnly />
                  <label className="form-check-label" style={{ fontSize: '13px' }}>{perm}</label>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div>
          <h6 className="fw-bold mb-2">التقارير</h6>
          <div className="row g-2">
            {['عرض التقارير', 'تصدير التقارير', 'التقارير المالية', 'سجل التدقيق'].map((perm, i) => (
              <div key={i} className="col-md-6">
                <div className="form-check">
                  <input className="form-check-input" type="checkbox" checked readOnly />
                  <label className="form-check-label" style={{ fontSize: '13px' }}>{perm}</label>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}
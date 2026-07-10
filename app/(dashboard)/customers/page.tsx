'use client';

import { useState, useEffect, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useToast } from '@/lib/toast-context';
import { 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaSearch, 
  FaUserTie,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaMoneyBillWave,
  FaFileInvoice,
  FaBuilding,
} from 'react-icons/fa';
import Modal from '@/components/ui/Modal';

interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  type: 'supplier' | 'customer' | 'both';
  balance: number;
  total_orders: number;
  last_order: string | null;
  notes: string | null;
  created_at: string;
}

interface StatementRow {
  id: string;
  date: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
}

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('ar-SA');
};

const formatCurrency = (value: number) => {
  return `$${value.toLocaleString('en-US')}`;
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const { showToast } = useToast();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showStatementModal, setShowStatementModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [statement, setStatement] = useState<StatementRow[]>([]);
  const [currentBalance, setCurrentBalance] = useState(0);

  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    type: 'customer' as string,
    notes: '',
  });

  const fetchCustomers = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (filterType !== 'all') params.append('type', filterType);
      if (searchTerm) params.append('search', searchTerm);

      const response = await fetch(`/api/customers?${params.toString()}`);
      const data = await response.json();
      setCustomers(data);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setIsLoading(false);
    }
  }, [filterType, searchTerm]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const fetchStatement = async (customerId: string) => {
    try {
      const response = await fetch(`/api/customers/${customerId}/statement`);
      const data = await response.json();
      setStatement(data.statement || []);
      setCurrentBalance(data.current_balance || 0);
    } catch (error) {
      console.error('Error fetching statement:', error);
    }
  };

  const getTypeBadge = (type: string) => {
    const typeMap: { [key: string]: { text: string; class: string; icon: ReactNode } } = {
      supplier: { text: 'مورد', class: 'bg-success', icon: <FaBuilding size={12} /> },
      customer: { text: 'عميل', class: 'bg-primary', icon: <FaUserTie size={12} /> },
      both: { text: 'مورد وعميل', class: 'bg-info', icon: <FaUserTie size={12} /> },
    };
    return typeMap[type] || { text: type, class: 'bg-secondary', icon: <FaUserTie size={12} /> };
  };

  const handleCreateCustomer = async () => {
    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCustomer),
      });

      if (response.ok) {
        setShowAddModal(false);
        setNewCustomer({ name: '', phone: '', email: '', address: '', type: 'customer', notes: '' });
        fetchCustomers();
      }
    } catch (error) {
      console.error('Error creating customer:', error);
    }
  };

  const handleUpdateCustomer = async () => {
    if (!selectedCustomer) return;

    try {
      const response = await fetch(`/api/customers/${selectedCustomer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedCustomer),
      });

      if (response.ok) {
        setShowAddModal(false);
        setSelectedCustomer(null);
        fetchCustomers();
      }
    } catch (error) {
      console.error('Error updating customer:', error);
    }
  };

 const handleDeleteCustomer = (id: string) => setConfirmDeleteId(id);

 const confirmDeleteCustomer = async () => {
  if (!confirmDeleteId) return;
  try {
    const res = await fetch(`/api/customers/${confirmDeleteId}`, { method: 'DELETE' });
    if (res.ok) {
      fetchCustomers();
      showToast('تم حذف العميل بنجاح', 'success');
    } else {
      showToast('حدث خطأ', 'error');
    }
  } catch {
    showToast('حدث خطأ', 'error');
  }
  setConfirmDeleteId(null);
};

  const totalBalance = customers
    .filter(c => c.type === 'customer' || c.type === 'both')
    .reduce((sum, c) => sum + Math.max(0, c.balance), 0);
  
  const totalPayables = customers
    .filter(c => c.type === 'supplier' || c.type === 'both')
    .reduce((sum, c) => sum + Math.abs(Math.min(0, c.balance)), 0);
  
  const totalOrders = customers.reduce((sum, c) => sum + c.total_orders, 0);

  if (isLoading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status" />
        <p className="mt-2 text-muted">جاري تحميل العملاء...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1" style={{ color: 'var(--surface-900)' }}>العملاء والموردين</h2>
          <p className="text-muted mb-0" style={{ fontSize: '14px' }}>إدارة حسابات العملاء والموردين</p>
        </div>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          className="btn btn-primary d-flex align-items-center gap-2" style={{ borderRadius: '10px', padding: '10px 20px' }}
          onClick={() => setShowAddModal(true)}>
          <FaPlus /> إضافة عميل/مورد جديد
        </motion.button>
      </motion.div>

      {/* Stats */}
      <div className="row g-3 mb-4">
        <div className="col-md-3 col-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="card text-white" style={{ borderRadius: '16px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <div className="card-body p-3 text-center">
              <FaUserTie size={24} className="mb-3" />
              <h3 className="fw-bold">{customers.length}</h3>
              <small>إجمالي العملاء والموردين</small>
            </div>
          </motion.div>
        </div>
        <div className="col-md-3 col-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="card text-white" style={{ borderRadius: '16px', background: 'linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)' }}>
            <div className="card-body p-3 text-center">
              <FaMoneyBillWave size={24} className="mb-3" />
              <h3 className="fw-bold">{formatCurrency(totalBalance)}</h3>
              <small>إجمالي المستحقات</small>
            </div>
          </motion.div>
        </div>
        <div className="col-md-3 col-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="card text-white" style={{ borderRadius: '16px', background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)' }}>
            <div className="card-body p-3 text-center">
              <FaBuilding size={24} className="mb-3" />
              <h3 className="fw-bold">{formatCurrency(totalPayables)}</h3>
              <small>إجمالي الديون</small>
            </div>
          </motion.div>
        </div>
        <div className="col-md-3 col-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="card text-white" style={{ borderRadius: '16px', background: 'linear-gradient(135deg, #f39c12 0%, #f1c40f 100%)' }}>
            <div className="card-body p-3 text-center">
              <FaFileInvoice size={24} className="mb-3" />
              <h3 className="fw-bold">{totalOrders}</h3>
              <small>إجمالي المعاملات</small>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Filters */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="card mb-4" style={{ borderRadius: '16px' }}>
        <div className="card-body p-3">
          <div className="row g-3 align-items-center">
            <div className="col-md-5">
              <div style={{ position: 'relative' }}>
                <FaSearch style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--surface-400)' }} />
                <input type="text" className="form-control" placeholder="بحث بالاسم، الهاتف، أو البريد..."
                  value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ padding: '10px 40px 10px 16px', borderRadius: '10px', border: '1px solid var(--surface-200)', fontSize: '14px' }} />
              </div>
            </div>
            <div className="col-md-3">
              <select className="form-select" value={filterType} onChange={(e) => setFilterType(e.target.value)}
                style={{ borderRadius: '10px', border: '1px solid var(--surface-200)', fontSize: '14px', padding: '10px 16px' }}>
                <option value="all">الكل</option>
                <option value="supplier">مورد</option>
                <option value="customer">عميل</option>
                <option value="both">مورد وعميل</option>
              </select>
            </div>
            <div className="col-md-4 text-end">
              <span className="text-muted" style={{ fontSize: '14px' }}>
                عدد النتائج: <strong>{customers.length}</strong>
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Customers Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="card" style={{ borderRadius: '16px', overflow: 'hidden' }}>
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead>
              <tr style={{ backgroundColor: 'var(--surface-50)', fontSize: '12px' }}>
                <th className="px-4 py-3">الاسم</th>
                <th className="px-4 py-3">النوع</th>
                <th className="px-4 py-3">رقم الهاتف</th>
                <th className="px-4 py-3">البريد الإلكتروني</th>
                <th className="px-4 py-3">العنوان</th>
                <th className="px-4 py-3">الرصيد</th>
                <th className="px-4 py-3">عدد الطلبات</th>
                <th className="px-4 py-3">آخر طلب</th>
                <th className="px-4 py-3">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {customers.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-4 text-muted">
                      <FaUserTie size={48} style={{ color: 'var(--surface-300)' }} />
                      <p className="mt-2">لا يوجد عملاء أو موردين</p>
                    </td>
                  </tr>
                ) : (
                  customers.map((customer, index) => {
                    const typeInfo = getTypeBadge(customer.type);
                    return (
                      <motion.tr key={customer.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }} transition={{ delay: index * 0.05 }}>
                        <td className="px-4 py-3">
                          <div className="d-flex align-items-center gap-2">
                            <div style={{
                              width: '36px', height: '36px', borderRadius: '50%',
                              backgroundColor: 'var(--primary-100)', display: 'flex', alignItems: 'center',
                              justifyContent: 'center', color: 'var(--primary-600)', fontSize: '14px', fontWeight: 'bold',
                            }}>
                              {customer.name.charAt(0)}
                            </div>
                            <span className="fw-semibold">{customer.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`badge ${typeInfo.class} d-flex align-items-center gap-1`}
                            style={{ width: 'fit-content', fontSize: '11px', padding: '5px 10px' }}>
                            {typeInfo.icon} {typeInfo.text}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="d-flex align-items-center gap-1">
                            <FaPhone size={12} style={{ color: 'var(--surface-400)' }} />
                            <span style={{ fontSize: '13px' }}>{customer.phone}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="d-flex align-items-center gap-1">
                            <FaEnvelope size={12} style={{ color: 'var(--surface-400)' }} />
                            <span style={{ fontSize: '13px' }}>{customer.email || '-'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="d-flex align-items-center gap-1">
                            <FaMapMarkerAlt size={12} style={{ color: 'var(--surface-400)' }} />
                            <span style={{ fontSize: '13px' }}>{customer.address || '-'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="fw-bold" style={{ 
                            color: customer.balance > 0 ? 'var(--accent-green)' : 
                                   customer.balance < 0 ? 'var(--accent-red)' : 'var(--surface-600)',
                            fontSize: '14px',
                          }}>
                            {customer.balance > 0 ? '+' : ''}{formatCurrency(customer.balance)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="badge bg-light text-dark">{customer.total_orders} طلب</span>
                        </td>
                        <td className="px-4 py-3 text-muted" style={{ fontSize: '13px' }}>
                          {formatDate(customer.last_order)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="d-flex gap-1">
                            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                              className="btn btn-sm btn-outline-info" style={{ borderRadius: '8px' }} title="كشف حساب"
                              onClick={() => {
                                setSelectedCustomer(customer);
                                fetchStatement(customer.id);
                                setShowStatementModal(true);
                              }}>
                              <FaFileInvoice size={14} />
                            </motion.button>
                            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                              className="btn btn-sm btn-outline-primary" style={{ borderRadius: '8px' }} title="تعديل"
                              onClick={() => { setSelectedCustomer(customer); setShowAddModal(true); }}>
                              <FaEdit size={14} />
                            </motion.button>
                            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                              className="btn btn-sm btn-outline-danger" style={{ borderRadius: '8px' }} title="حذف"
                              onClick={() => handleDeleteCustomer(customer.id)}>
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

      {/* Add/Edit Customer Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => { setShowAddModal(false); setSelectedCustomer(null); }}
        title={selectedCustomer ? 'تعديل عميل/مورد' : 'إضافة عميل/مورد جديد'}
        size="lg"
        footer={
          <div className="d-flex justify-content-end gap-2">
            <button className="btn btn-secondary" onClick={() => { setShowAddModal(false); setSelectedCustomer(null); }} style={{ borderRadius: '10px' }}>إلغاء</button>
            <button className="btn btn-primary" onClick={selectedCustomer ? handleUpdateCustomer : handleCreateCustomer} style={{ borderRadius: '10px' }}>
              {selectedCustomer ? 'حفظ التعديلات' : 'إضافة'}
            </button>
          </div>
        }
      >
        <div className="row">
          <div className="col-md-6 mb-3">
            <label className="form-label fw-semibold">الاسم</label>
            <input type="text" className="form-control" placeholder="أدخل الاسم"
              value={selectedCustomer ? selectedCustomer.name : newCustomer.name}
              onChange={(e) => selectedCustomer ? setSelectedCustomer({ ...selectedCustomer, name: e.target.value }) : setNewCustomer({ ...newCustomer, name: e.target.value })}
              style={{ borderRadius: '10px' }} />
          </div>
          <div className="col-md-6 mb-3">
            <label className="form-label fw-semibold">النوع</label>
            <select className="form-select"
              value={selectedCustomer ? selectedCustomer.type : newCustomer.type}
              onChange={(e) => selectedCustomer 
  ? setSelectedCustomer({ ...selectedCustomer, type: e.target.value as 'supplier' | 'customer' | 'both' }) 
  : setNewCustomer({ ...newCustomer, type: e.target.value })
}
              style={{ borderRadius: '10px' }}>
              <option value="supplier">مورد</option>
              <option value="customer">عميل</option>
              <option value="both">مورد وعميل</option>
            </select>
          </div>
          <div className="col-md-6 mb-3">
            <label className="form-label fw-semibold">رقم الهاتف</label>
            <input type="text" className="form-control" placeholder="أدخل رقم الهاتف"
              value={selectedCustomer ? selectedCustomer.phone : newCustomer.phone}
              onChange={(e) => selectedCustomer ? setSelectedCustomer({ ...selectedCustomer, phone: e.target.value }) : setNewCustomer({ ...newCustomer, phone: e.target.value })}
              style={{ borderRadius: '10px' }} />
          </div>
          <div className="col-md-6 mb-3">
            <label className="form-label fw-semibold">البريد الإلكتروني</label>
            <input type="email" className="form-control" placeholder="أدخل البريد الإلكتروني"
              value={selectedCustomer ? (selectedCustomer.email || '') : newCustomer.email}
              onChange={(e) => selectedCustomer ? setSelectedCustomer({ ...selectedCustomer, email: e.target.value }) : setNewCustomer({ ...newCustomer, email: e.target.value })}
              style={{ borderRadius: '10px' }} />
          </div>
          <div className="col-12 mb-3">
            <label className="form-label fw-semibold">العنوان</label>
            <input type="text" className="form-control" placeholder="أدخل العنوان"
              value={selectedCustomer ? (selectedCustomer.address || '') : newCustomer.address}
              onChange={(e) => selectedCustomer ? setSelectedCustomer({ ...selectedCustomer, address: e.target.value }) : setNewCustomer({ ...newCustomer, address: e.target.value })}
              style={{ borderRadius: '10px' }} />
          </div>
          <div className="col-12 mb-3">
            <label className="form-label fw-semibold">ملاحظات</label>
            <textarea className="form-control" rows={3} placeholder="أدخل ملاحظات..."
              value={selectedCustomer ? (selectedCustomer.notes || '') : newCustomer.notes}
              onChange={(e) => selectedCustomer ? setSelectedCustomer({ ...selectedCustomer, notes: e.target.value }) : setNewCustomer({ ...newCustomer, notes: e.target.value })}
              style={{ borderRadius: '10px' }} />
          </div>
        </div>
      </Modal>

      {/* Statement Modal */}
      <Modal
        isOpen={showStatementModal}
        onClose={() => setShowStatementModal(false)}
        title={`كشف حساب: ${selectedCustomer?.name}`}
        size="lg"
        footer={
          <div className="d-flex justify-content-between align-items-center w-100">
            <div className="d-flex align-items-center gap-2">
              <span className="fw-semibold">الرصيد الحالي:</span>
              <span className="fw-bold" style={{ color: currentBalance > 0 ? 'var(--accent-green)' : 'var(--accent-red)', fontSize: '18px' }}>
                {formatCurrency(currentBalance)}
              </span>
            </div>
            <div className="d-flex gap-2">
              <button className="btn btn-outline-primary" style={{ borderRadius: '10px' }} onClick={() => window.print()}>
                <FaFileInvoice className="me-1" /> طباعة
              </button>
              <button className="btn btn-secondary" onClick={() => setShowStatementModal(false)} style={{ borderRadius: '10px' }}>إغلاق</button>
            </div>
          </div>
        }
      >
        <div className="mb-3">
          <div className="row">
            <div className="col-md-6">
              <small className="text-muted">العميل/المورد</small>
              <p className="fw-semibold">{selectedCustomer?.name}</p>
            </div>
            <div className="col-md-6">
              <small className="text-muted">النوع</small>
              <p>{selectedCustomer && (
                <span className={`badge ${getTypeBadge(selectedCustomer.type).class}`}>
                  {getTypeBadge(selectedCustomer.type).text}
                </span>
              )}</p>
            </div>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table table-bordered">
            <thead>
              <tr style={{ backgroundColor: 'var(--surface-50)', fontSize: '12px' }}>
                <th className="px-3 py-2">التاريخ</th>
                <th className="px-3 py-2">البيان</th>
                <th className="px-3 py-2">مدين</th>
                <th className="px-3 py-2">دائن</th>
                <th className="px-3 py-2">الرصيد</th>
              </tr>
            </thead>
            <tbody>
              {statement.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-3 text-muted">لا توجد معاملات</td>
                </tr>
              ) : (
                statement.map((row, index) => (
                  <tr key={row.id}>
                    <td className="px-3 py-2" style={{ fontSize: '13px' }}>{formatDate(row.date)}</td>
                    <td className="px-3 py-2" style={{ fontSize: '13px' }}>{row.description}</td>
                    <td className="px-3 py-2 text-danger" style={{ fontSize: '13px' }}>
                      {row.debit > 0 ? formatCurrency(row.debit) : '-'}
                    </td>
                    <td className="px-3 py-2 text-success" style={{ fontSize: '13px' }}>
                      {row.credit > 0 ? formatCurrency(row.credit) : '-'}
                    </td>
                    <td className="px-3 py-2 fw-semibold" style={{ fontSize: '13px', color: row.balance > 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                      {formatCurrency(row.balance)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Modal>
      <ConfirmDialog
  isOpen={!!confirmDeleteId}
  onClose={() => setConfirmDeleteId(null)}
  onConfirm={confirmDeleteCustomer}
  title="حذف العميل"
  message="هل أنت متأكد من حذف هذا العميل؟ لا يمكن التراجع عن هذا الإجراء."
  confirmText="حذف"
  type="danger"
/>
    </div>
  );
}
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSort, FaSortUp, FaSortDown, FaEllipsisV } from 'react-icons/fa';

interface Column {
  key: string;
  header: string;
  sortable?: boolean;
  render?: (value: any, row: any) => React.ReactNode;
}

interface DataTableProps {
  columns: Column[];
  data: any[];
  onRowClick?: (row: any) => void;
  actions?: (row: any) => React.ReactNode;
  isLoading?: boolean;
}

export default function DataTable({ columns, data, onRowClick, actions, isLoading }: DataTableProps) {
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig?.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  return (
    <div className="card" style={{ borderRadius: '12px', overflow: 'hidden' }}>
      {selectedRows.size > 0 && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="px-4 py-2 d-flex align-items-center justify-content-between"
          style={{ backgroundColor: 'var(--primary-50)' }}
        >
          <span style={{ color: 'var(--primary-700)', fontSize: '0.875rem' }}>
            تم تحديد {selectedRows.size} عنصر
          </span>
          <div className="d-flex gap-2">
            <button className="btn btn-sm btn-primary">حذف المحدد</button>
            <button className="btn btn-sm btn-outline-secondary">تصدير</button>
          </div>
        </motion.div>
      )}
      
      <div className="table-responsive">
        <table className="table table-hover mb-0">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key} className="px-4 py-3">
                  <div className="d-flex align-items-center gap-2">
                    {column.header}
                    {column.sortable && (
                      <button 
                        className="btn btn-link p-0 border-0"
                        onClick={() => handleSort(column.key)}
                        style={{ color: 'var(--surface-400)', fontSize: '0.75rem' }}
                      >
                        {sortConfig?.key === column.key ? (
                          sortConfig.direction === 'asc' ? <FaSortUp /> : <FaSortDown />
                        ) : (
                          <FaSort />
                        )}
                      </button>
                    )}
                  </div>
                </th>
              ))}
              {actions && <th className="px-4 py-3" style={{ width: '50px' }}></th>}
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {data.map((row, index) => (
                <motion.tr
                  key={row.id || index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  style={{ cursor: onRowClick ? 'pointer' : 'default' }}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((column) => (
                    <td key={column.key} className="px-4 py-3">
                      {column.render ? column.render(row[column.key], row) : row[column.key]}
                    </td>
                  ))}
                  {actions && (
                    <td className="px-4 py-3">
                      {actions(row)}
                    </td>
                  )}
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </div>
  );
}
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { FaExclamationTriangle } from 'react-icons/fa';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

export default function ConfirmDialog({ 
  isOpen, onClose, onConfirm, title, message, 
  confirmText = 'تأكيد', cancelText = 'إلغاء', type = 'danger' 
}: ConfirmDialogProps) {
  const colors = {
    danger: { bg: '#fef2f2', border: '#fecaca', icon: '#ef4444', btn: '#ef4444' },
    warning: { bg: '#fffbeb', border: '#fde68a', icon: '#f59e0b', btn: '#f59e0b' },
    info: { bg: '#eff6ff', border: '#bfdbfe', icon: '#3b82f6', btn: '#3b82f6' },
  };

  const c = colors[type];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="modal d-block" style={{ zIndex: 1060 }}>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 1040 }}
            onClick={onClose} />
          <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="modal-dialog modal-dialog-centered modal-sm" style={{ zIndex: 1050 }}>
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ backgroundColor: c.bg, padding: '24px 24px 16px', textAlign: 'center' }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: 24 }}>
                  <FaExclamationTriangle style={{ color: c.icon }} />
                </div>
                <h6 className="fw-bold mb-2">{title}</h6>
                <p className="text-muted mb-0" style={{ fontSize: 14 }}>{message}</p>
              </div>
              <div className="d-flex gap-2 p-3 justify-content-center" style={{ backgroundColor: 'white' }}>
                <button className="btn btn-secondary" onClick={onClose} style={{ borderRadius: 10, minWidth: 100 }}>{cancelText}</button>
                <button className="btn text-white" onClick={() => { onConfirm(); onClose(); }} style={{ borderRadius: 10, minWidth: 100, backgroundColor: c.btn }}>{confirmText}</button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
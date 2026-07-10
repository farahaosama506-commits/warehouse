'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaTimes } from 'react-icons/fa';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type: ToastType) => void;
}

const ToastContext = createContext<ToastContextType>({
  showToast: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);

    // إزالة الإشعار بعد 4 ثواني
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const getToastStyle = (type: ToastType) => {
    switch(type) {
      case 'success':
        return {
          bg: '#d4edda',
          border: '#c3e6cb',
          text: '#155724',
          icon: <FaCheckCircle style={{ color: '#28a745', fontSize: '20px' }} />,
        };
      case 'error':
        return {
          bg: '#f8d7da',
          border: '#f5c6cb',
          text: '#721c24',
          icon: <FaExclamationCircle style={{ color: '#dc3545', fontSize: '20px' }} />,
        };
      case 'info':
        return {
          bg: '#d1ecf1',
          border: '#bee5eb',
          text: '#0c5460',
          icon: <FaInfoCircle style={{ color: '#17a2b8', fontSize: '20px' }} />,
        };
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Toast Container */}
      <div style={{
        position: 'fixed',
        top: '20px',
        left: '20px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}>
        <AnimatePresence>
          {toasts.map((toast) => {
            const style = getToastStyle(toast.type);
            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, x: 100, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 100, scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                style={{
                  backgroundColor: style.bg,
                  border: `1px solid ${style.border}`,
                  color: style.text,
                  borderRadius: '12px',
                  padding: '14px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  minWidth: '320px',
                  maxWidth: '450px',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
                  direction: 'rtl',
                }}
              >
                <span style={{ flexShrink: 0 }}>{style.icon}</span>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: '500', flex: 1 }}>
                  {toast.message}
                </p>
                <button
                  onClick={() => removeToast(toast.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: style.text,
                    opacity: 0.7,
                    padding: '4px',
                    flexShrink: 0,
                  }}
                >
                  <FaTimes size={14} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
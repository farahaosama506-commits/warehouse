'use client';

import { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  footer?: ReactNode;
}

export default function Modal({ isOpen, onClose, title, children, size = 'md', footer }: ModalProps) {
  const sizeMap = {
    sm: 'modal-sm',
    md: '',
    lg: 'modal-lg',
    xl: 'modal-xl',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              backdropFilter: 'blur(4px)',
              zIndex: 1040,
            }}
            onClick={onClose}
          />
          <div 
            className="modal d-block" 
            style={{ zIndex: 1050 }}
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className={`modal-dialog modal-dialog-centered ${sizeMap[size]}`}
            >
              <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '16px' }}>
                <div className="modal-header border-0 px-4 pt-4">
                  <h5 className="modal-title fw-bold">{title}</h5>
                  <button 
                    type="button" 
                    className="btn-close" 
                    onClick={onClose}
                    aria-label="Close"
                  />
                </div>
                <div className="modal-body px-4">
                  {children}
                </div>
                {footer && (
                  <div className="modal-footer border-0 px-4 pb-4">
                    {footer}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
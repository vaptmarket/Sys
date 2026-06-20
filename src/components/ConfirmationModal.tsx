import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export default function ConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = 'Confirmar', 
  cancelText = 'Cancelar',
  variant = 'danger',
  isLoading = false
}: ConfirmationModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]"
          />
          <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-[101] p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-surface-panel border border-white/10 rounded-[2.5rem] w-full max-w-md pointer-events-auto overflow-hidden shadow-2xl"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                    variant === 'danger' ? 'bg-rose-500/10 text-rose-500' :
                    variant === 'warning' ? 'bg-brand-orange/10 text-brand-orange' :
                    'bg-brand-blue/10 text-brand-blue'
                  }`}>
                    <AlertCircle size={24} />
                  </div>
                  <button 
                    onClick={onClose}
                    className="text-white/20 hover:text-white transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <h3 className="text-xl font-black text-white italic uppercase tracking-tighter mb-2">
                  {title}
                </h3>
                <p className="text-white/40 text-xs font-medium leading-relaxed">
                  {message}
                </p>
              </div>

              <div className="bg-white/5 p-6 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={onClose}
                  disabled={isLoading}
                  className="flex-1 px-8 py-3 bg-white/5 text-white/40 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-white/10 transition-all disabled:opacity-50"
                >
                  {cancelText}
                </button>
                <button
                  onClick={onConfirm}
                  disabled={isLoading}
                  className={`flex-1 px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-xl disabled:opacity-50 flex items-center justify-center gap-2 ${
                    variant === 'danger' ? 'bg-rose-500 text-white shadow-rose-500/20 hover:bg-rose-600' :
                    variant === 'warning' ? 'bg-brand-orange text-white shadow-brand-orange/20 hover:bg-brand-orange/80' :
                    'bg-brand-blue text-white shadow-brand-blue/20 hover:bg-brand-blue/80'
                  }`}
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : confirmText}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

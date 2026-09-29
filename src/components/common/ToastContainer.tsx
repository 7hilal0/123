import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, Info, AlertTriangle } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full">
      {toasts.map((toast) => {
        return (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl bg-neutral-900/95 border border-white/10 shadow-2xl backdrop-blur-md text-sm text-neutral-100 transition-all transform animate-in fade-in slide-in-from-bottom-3"
          >
            {toast.type === 'success' && (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            )}
            {toast.type === 'warning' && (
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            )}
            {(!toast.type || toast.type === 'info') && (
              <Info className="w-5 h-5 text-indigo-400 shrink-0" />
            )}
            <span className="flex-1 font-medium">{toast.message}</span>
          </div>
        );
      })}
    </div>
  );
};

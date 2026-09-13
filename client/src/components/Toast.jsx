import React from 'react';
import { useApp } from '../context/AppContext';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export default function ToastContainer() {
  const { toasts } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-2xl border backdrop-blur-md transition-all duration-300 animate-slide-in ${
            toast.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-100'
              : toast.type === 'error'
              ? 'bg-rose-950/90 border-rose-500/40 text-rose-100'
              : 'bg-slate-900/95 border-teal-500/40 text-slate-100'
          }`}
        >
          {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />}
          {toast.type === 'error' && <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />}
          {toast.type === 'info' && <Info className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />}

          <div className="flex-1 text-sm">
            <h4 className="font-semibold">{toast.title}</h4>
            {toast.message && <p className="text-xs mt-0.5 opacity-90">{toast.message}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

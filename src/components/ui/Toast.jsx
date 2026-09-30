import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

const iconMap = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const colorMap = {
  success: 'var(--lime)',
  error: 'var(--error)',
  warning: 'var(--warning)',
  info: 'var(--info)',
};

export function ToastContainer() {
  const { toasts, removeToast } = useApp();

  return (
    <div className="toast-container">
      {toasts.map(toast => {
        const Icon = iconMap[toast.type] || Info;
        return (
          <div key={toast.id} className={`toast ${toast.type}`}>
            <Icon size={18} style={{ color: colorMap[toast.type], flexShrink: 0, marginTop: 1 }} />
            <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)', flex: 1 }}>
              {toast.message}
            </span>
            <button
              onClick={() => removeToast(toast.id)}
              style={{ background: 'none', color: 'var(--text-muted)', cursor: 'pointer', flexShrink: 0 }}
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

import { useState, useEffect } from 'react';

export interface Toast {
  id: string;
  type: 'error' | 'success' | 'info' | 'warning';
  title: string;
  message?: string;
  duration?: number;
}

interface ToastProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

export default function Toast({ toasts, onDismiss }: ToastProps) {
  useEffect(() => {
    const timers: { [key: string]: NodeJS.Timeout } = {};

    toasts.forEach(toast => {
      if (toast.duration !== 0) { // 0 means no auto-dismiss
        timers[toast.id] = setTimeout(() => {
          onDismiss(toast.id);
        }, toast.duration || 5000);
      }
    });

    return () => {
      Object.values(timers).forEach(timer => clearTimeout(timer));
    };
  }, [toasts, onDismiss]);

  if (toasts.length === 0) return null;

  const getToastStyles = (type: Toast['type']) => {
    switch (type) {
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getToastIcon = (type: Toast['type']) => {
    switch (type) {
      case 'error':
        return '❌';
      case 'success':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '📝';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`
            ${getToastStyles(toast.type)}
            border rounded-lg shadow-lg p-4 
            transform transition-all duration-300 ease-in-out
            animate-slide-in-right
          `}
        >
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 text-lg">
              {getToastIcon(toast.type)}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm">{toast.title}</h3>
              {toast.message && (
                <p className="mt-1 text-sm opacity-90">{toast.message}</p>
              )}
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="flex-shrink-0 ml-2 opacity-60 hover:opacity-100 transition-opacity"
            >
              <span className="sr-only">Dismiss</span>
              <span className="text-lg">×</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// Hook for managing toasts
export function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { ...toast, id }]);
    return id;
  };

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const clearToasts = () => {
    setToasts([]);
  };

  // Convenience methods
  const showError = (title: string, message?: string, duration?: number) => 
    addToast({ type: 'error', title, message, duration });

  const showSuccess = (title: string, message?: string, duration?: number) => 
    addToast({ type: 'success', title, message, duration });

  const showWarning = (title: string, message?: string, duration?: number) => 
    addToast({ type: 'warning', title, message, duration });

  const showInfo = (title: string, message?: string, duration?: number) => 
    addToast({ type: 'info', title, message, duration });

  return {
    toasts,
    addToast,
    dismissToast,
    clearToasts,
    showError,
    showSuccess,
    showWarning,
    showInfo,
  };
}
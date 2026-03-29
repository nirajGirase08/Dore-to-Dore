import React, { useEffect } from 'react';
import { useNotifications } from '../../contexts/NotificationContext';

const formatTimeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
};

const SEVERITY_COLORS = {
  low:    'border-l-green-400',
  medium: 'border-l-yellow-400',
};

// Individual toast — auto-dismisses after 5 s
const Toast = ({ toast, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.toastId), 5000);
    return () => clearTimeout(timer);
  }, [toast.toastId, onDismiss]);

  // Extract blockage type from title (e.g. "Nearby Blockage: road closure")
  toast.title?.toLowerCase().replace(/.*: /, '').replace(/ /g, '_');
  const borderColor = toast.notification_type === 'weather_alert'
    ? 'border-l-blue-500'
    : SEVERITY_COLORS[toast.severity] || 'border-l-orange-400';

  return (
    <div
      className={`bg-white shadow-xl rounded-lg border border-gray-200 border-l-4 ${borderColor} p-4 w-80 flex items-start gap-3 animate-slide-in`}
    >
      <span className="mt-1 h-3 w-3 flex-shrink-0 rounded-full bg-[#a1842f]"></span>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-800 text-sm leading-snug">{toast.title}</p>
        {toast.message && (
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{toast.message}</p>
        )}
        <p className="text-xs text-orange-500 font-medium mt-1">
          {toast.notification_type === 'weather_alert' ? 'Detected' : 'Reported'} {formatTimeAgo(toast.created_at)}
        </p>
      </div>
      <button
        onClick={() => onDismiss(toast.toastId)}
        className="flex-shrink-0 text-gray-400 hover:text-gray-600 text-xl leading-none mt-0.5"
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
};

// Container — fixed top-right, stacks up to 3
const ToastNotification = () => {
  const { toasts, dismissToast } = useNotifications();

  if (!toasts.length) return null;

  return (
    <div className="fixed top-20 right-4 z-50 flex flex-col gap-2">
      {toasts.slice(0, 3).map((toast) => (
        <Toast key={toast.toastId} toast={toast} onDismiss={dismissToast} />
      ))}
    </div>
  );
};

export default ToastNotification;

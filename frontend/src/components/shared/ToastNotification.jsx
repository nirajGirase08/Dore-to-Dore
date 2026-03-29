import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../contexts/NotificationContext';

const formatTimeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
};

const TYPE_ICONS = {
  accident:     '🚨',
  tree_down:    '🌳',
  flooding:     '🌊',
  ice:          '🧊',
  power_line:   '⚡',
  debris:       '🪨',
  road_closure: '🚧',
  other:        '⚠️',
};

const SEVERITY_COLORS = {
  low:    'border-l-green-400',
  medium: 'border-l-yellow-400',
};

// Ride request toast — no auto-dismiss, has Accept/Dismiss action buttons
const RideToast = ({ toast, onDismiss }) => {
  const { markRead, acceptRideFromToast } = useNotifications();
  const navigate = useNavigate();
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState('');

  const borderColor = toast.severity === 'critical' ? 'border-l-red-500' : 'border-l-orange-500';

  const handleAccept = async () => {
    setAccepting(true);
    setError('');
    try {
      await acceptRideFromToast(toast.related_id, toast.notification_id);
      onDismiss(toast.toastId);
      navigate(`/rides/${toast.related_id}`);
    } catch {
      setError('Could not accept ride. Try again.');
      setAccepting(false);
    }
  };

  const handleDismiss = async () => {
    await markRead(toast.notification_id);
    onDismiss(toast.toastId);
  };

  return (
    <div className={`bg-white shadow-xl rounded-lg border border-gray-200 border-l-4 ${borderColor} p-4 w-80 animate-slide-in`}>
      <div className="flex items-start gap-3">
        <span className="text-2xl flex-shrink-0">🚗</span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-800 text-sm leading-snug">{toast.title}</p>
          {toast.message && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{toast.message}</p>
          )}
          <p className="text-xs text-orange-500 font-medium mt-1">
            Requested {formatTimeAgo(toast.created_at)}
          </p>
          {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          <div className="mt-2 flex gap-2">
            <button
              onClick={handleAccept}
              disabled={accepting}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold py-1.5 rounded-md transition-colors disabled:opacity-50"
            >
              {accepting ? 'Accepting…' : 'Accept'}
            </button>
            <button
              onClick={handleDismiss}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold py-1.5 rounded-md transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
        <button onClick={handleDismiss} className="flex-shrink-0 text-gray-400 hover:text-gray-600 text-xl leading-none mt-0.5" aria-label="Dismiss">×</button>
      </div>
    </div>
  );
};

// Individual toast — auto-dismisses after 5 s
const Toast = ({ toast, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.toastId), 5000);
    return () => clearTimeout(timer);
  }, [toast.toastId, onDismiss]);

  // Extract blockage type from title (e.g. "🚧 Nearby Blockage: road closure")
  const typeKey = toast.title?.toLowerCase().replace(/.*: /, '').replace(/ /g, '_');
  const icon = toast.notification_type === 'weather_alert'
    ? '🌩️'
    : TYPE_ICONS[typeKey] || '🚧';
  const borderColor = toast.notification_type === 'weather_alert'
    ? 'border-l-blue-500'
    : SEVERITY_COLORS[toast.severity] || 'border-l-orange-400';

  return (
    <div
      className={`bg-white shadow-xl rounded-lg border border-gray-200 border-l-4 ${borderColor} p-4 w-80 flex items-start gap-3 animate-slide-in`}
    >
      <span className="text-2xl flex-shrink-0">{icon}</span>
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

// Container — fixed top-right, stacks up to 3; ride_request toasts shown first
const ToastNotification = () => {
  const { toasts, dismissToast } = useNotifications();

  if (!toasts.length) return null;

  const sorted = [...toasts].sort((a, b) => {
    if (a.notification_type === 'ride_request' && b.notification_type !== 'ride_request') return -1;
    if (b.notification_type === 'ride_request' && a.notification_type !== 'ride_request') return 1;
    return 0;
  });

  return (
    <div className="fixed top-20 right-4 z-50 flex flex-col gap-2">
      {sorted.slice(0, 3).map((toast) =>
        toast.notification_type === 'ride_request'
          ? <RideToast key={toast.toastId} toast={toast} onDismiss={dismissToast} />
          : <Toast key={toast.toastId} toast={toast} onDismiss={dismissToast} />
      )}
    </div>
  );
};

export default ToastNotification;

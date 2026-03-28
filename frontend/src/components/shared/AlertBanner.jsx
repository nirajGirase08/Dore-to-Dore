import React from 'react';
import { useNotifications } from '../../contexts/NotificationContext';

const AlertBanner = () => {
  const { bannerNotifications, markRead } = useNotifications();

  if (!bannerNotifications.length) return null;

  // Show the most recent alert; indicate how many more exist
  const latest = bannerNotifications[0];
  const extra = bannerNotifications.length - 1;
  const isCritical = latest.severity === 'critical';

  return (
    <div
      className={`flex items-center justify-between px-4 py-3 text-white text-sm ${
        isCritical ? 'bg-red-700' : 'bg-orange-600'
      }`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-lg flex-shrink-0">{isCritical ? '⚠️' : '🚨'}</span>
        <div className="min-w-0">
          <span className="font-bold">{latest.title}</span>
          {latest.message && (
            <span className="ml-2 opacity-90 hidden sm:inline">{latest.message}</span>
          )}
          {extra > 0 && (
            <span className="ml-2 opacity-75">+{extra} more alert{extra > 1 ? 's' : ''}</span>
          )}
        </div>
      </div>
      <button
        onClick={() => markRead(latest.notification_id)}
        className="ml-4 flex-shrink-0 text-white opacity-75 hover:opacity-100 text-xl font-bold leading-none"
        aria-label="Dismiss alert"
      >
        ×
      </button>
    </div>
  );
};

export default AlertBanner;

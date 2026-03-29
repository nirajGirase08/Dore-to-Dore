import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useDemoContext } from './DemoContext';
import { notificationsAPI, weatherAPI } from '../services/api';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const { getWeatherContextPayload } = useDemoContext();
  const [notifications, setNotifications] = useState([]);
  const [weatherAlerts, setWeatherAlerts] = useState([]);
  const [toasts, setToasts] = useState([]);

  // Track which notification IDs have already been shown as toasts
  const shownToastIds = useRef(new Set());
  const dismissedLocalAlertIds = useRef(new Set());

  const fetchNotifications = useCallback(async () => {
    try {
      const [notificationData, weatherData] = await Promise.allSettled([
        notificationsAPI.getUnread(),
        weatherAPI.getAlerts(getWeatherContextPayload()),
      ]);

      const incoming = notificationData.status === 'fulfilled'
        ? (notificationData.value.notifications || [])
        : [];
      const weatherIncoming = ((weatherData.status === 'fulfilled'
        ? weatherData.value.data?.alerts
        : []) || []).filter(
        (alert) => !dismissedLocalAlertIds.current.has(alert.notification_id)
      );

      setNotifications(incoming);
      setWeatherAlerts(weatherIncoming);

      const bellNotifs = [
        ...incoming.filter((n) => n.notification_type === 'blockage_nearby'),
        ...weatherIncoming,
      ];
      const newOnes = bellNotifs.filter((n) => !shownToastIds.current.has(n.notification_id));

      if (newOnes.length > 0) {
        newOnes.forEach((n) => shownToastIds.current.add(n.notification_id));
        setToasts((prev) => [
          ...prev,
          ...newOnes.map((n) => ({ ...n, toastId: n.notification_id })),
        ]);
      }
    } catch {
      // Fail silently
    }
  }, [getWeatherContextPayload]);

  // Reset state when auth changes (login/logout)
  useEffect(() => {
    shownToastIds.current = new Set();
    dismissedLocalAlertIds.current = new Set();
    setToasts([]);
    setNotifications([]);
    setWeatherAlerts([]);
  }, [isAuthenticated]);

  // Start polling only once auth is fully settled (not loading) and user is authenticated
  useEffect(() => {
    if (loading || !isAuthenticated) return;
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated, loading, fetchNotifications]);

  const markRead = async (id) => {
    if (String(id).startsWith('weather-')) {
      dismissedLocalAlertIds.current.add(id);
      setWeatherAlerts((prev) => prev.filter((n) => n.notification_id !== id));
      return;
    }

    try {
      await notificationsAPI.markRead(id);
      setNotifications((prev) => prev.filter((n) => n.notification_id !== id));
    } catch {}
  };

  const markAllRead = async () => {
    dismissedLocalAlertIds.current = new Set([
      ...dismissedLocalAlertIds.current,
      ...weatherAlerts.map((alert) => alert.notification_id),
    ]);
    setWeatherAlerts([]);

    try {
      await notificationsAPI.markAllRead();
      setNotifications([]);
    } catch {}
  };

  const dismissToast = (toastId) => {
    setToasts((prev) => prev.filter((t) => t.toastId !== toastId));
  };

  const bannerNotifications = [
    ...weatherAlerts,
    ...notifications.filter((n) => n.notification_type === 'blockage_alert'),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const bellNotifications = [
    ...weatherAlerts,
    ...notifications.filter((n) => n.notification_type === 'blockage_nearby'),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        weatherAlerts,
        bannerNotifications,
        bellNotifications,
        toasts,
        unreadCount: notifications.length + weatherAlerts.length,
        markRead,
        markAllRead,
        dismissToast,
        refresh: fetchNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);

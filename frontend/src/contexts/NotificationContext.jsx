import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { notificationsAPI } from '../services/api';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [toasts, setToasts] = useState([]);

  // Track which notification IDs have already been shown as toasts
  const shownToastIds = useRef(new Set());

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await notificationsAPI.getUnread();
      const incoming = data.notifications || [];
      setNotifications(incoming);

      const bellNotifs = incoming.filter((n) => n.notification_type === 'blockage_nearby');
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
  }, []); // stable reference — no deps, reads from refs

  // Reset state when auth changes (login/logout)
  useEffect(() => {
    shownToastIds.current = new Set();
    setToasts([]);
    setNotifications([]);
  }, [isAuthenticated]);

  // Start polling only once auth is fully settled (not loading) and user is authenticated
  useEffect(() => {
    if (loading || !isAuthenticated) return;
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated, loading, fetchNotifications]);

  const markRead = async (id) => {
    try {
      await notificationsAPI.markRead(id);
      setNotifications((prev) => prev.filter((n) => n.notification_id !== id));
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await notificationsAPI.markAllRead();
      setNotifications([]);
    } catch {}
  };

  const dismissToast = (toastId) => {
    setToasts((prev) => prev.filter((t) => t.toastId !== toastId));
  };

  const bannerNotifications = notifications.filter(
    (n) => n.notification_type === 'blockage_alert'
  );

  const bellNotifications = notifications.filter(
    (n) => n.notification_type === 'blockage_nearby'
  );

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        bannerNotifications,
        bellNotifications,
        toasts,
        unreadCount: notifications.length,
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

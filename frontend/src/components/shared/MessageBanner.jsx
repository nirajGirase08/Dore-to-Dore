import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { conversationsAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const POLL_INTERVAL_MS = 5000;

const MessageBanner = () => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [bannerMessage, setBannerMessage] = useState(null);
  const lastSeenMessageIdRef = useRef(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || location.pathname.startsWith('/messages')) {
      setBannerMessage(null);
      return undefined;
    }

    let isMounted = true;

    const pollLatestUnread = async () => {
      try {
        const response = await conversationsAPI.getLatestUnread();
        const latestUnread = response.data;

        if (!isMounted) {
          return;
        }

        if (!initializedRef.current) {
          lastSeenMessageIdRef.current = latestUnread?.message_id || null;
          initializedRef.current = true;
          return;
        }

        if (!latestUnread?.message_id) {
          return;
        }

        if (latestUnread.message_id !== lastSeenMessageIdRef.current) {
          lastSeenMessageIdRef.current = latestUnread.message_id;
          setBannerMessage(latestUnread);
        }
      } catch (error) {
        console.error('Failed to poll latest unread message:', error);
      }
    };

    pollLatestUnread();
    const intervalId = window.setInterval(pollLatestUnread, POLL_INTERVAL_MS);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [isAuthenticated, location.pathname]);

  if (!bannerMessage) {
    return null;
  }

  return (
    <div className="border-b border-cyan-200 bg-cyan-50">
      <div className="container-custom py-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-cyan-950">
              New message from {bannerMessage.sender?.name || bannerMessage.other_user?.name || 'a user'}
            </p>
            <p className="truncate text-sm text-cyan-900">
              {bannerMessage.message_text}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setBannerMessage(null);
                navigate(`/messages/${bannerMessage.conversation_id}`);
              }}
              className="rounded-lg bg-cyan-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-cyan-800"
            >
              Open Message
            </button>
            <button
              onClick={() => setBannerMessage(null)}
              className="rounded-lg border border-cyan-300 px-4 py-2 text-sm font-semibold text-cyan-950 transition-colors hover:bg-cyan-100"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageBanner;

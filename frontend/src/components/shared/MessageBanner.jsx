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
    <div className="fixed top-20 right-4 z-50 w-80 max-w-[calc(100vw-2rem)] animate-slide-in">
      <div className="bg-white shadow-2xl rounded-xl border border-gray-200 border-l-4 border-l-cyan-500 p-4">
        <div className="flex items-start gap-3">
          <span className="text-xl flex-shrink-0">💬</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800">
              New message from {bannerMessage.sender?.name || bannerMessage.other_user?.name || 'a user'}
            </p>
            <p className="truncate text-xs text-gray-500 mt-0.5">
              {bannerMessage.message_text}
            </p>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => {
                  setBannerMessage(null);
                  navigate(`/messages/${bannerMessage.conversation_id}`);
                }}
                className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold py-1.5 rounded-md transition-colors"
              >
                Open
              </button>
              <button
                onClick={() => setBannerMessage(null)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold py-1.5 rounded-md transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
          <button onClick={() => setBannerMessage(null)} className="flex-shrink-0 text-gray-400 hover:text-gray-600 text-xl leading-none mt-0.5" aria-label="Dismiss">×</button>
        </div>
      </div>
    </div>
  );
};

export default MessageBanner;

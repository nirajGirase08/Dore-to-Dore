import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { conversationsAPI, trustAPI } from '../services/api';
import PendingFeedbackSection from '../components/shared/PendingFeedbackSection';
import TrustSummary from '../components/shared/TrustSummary';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [trustSummary, setTrustSummary] = useState(null);
  const [pendingFeedback, setPendingFeedback] = useState([]);

  const loadTrust = async () => {
    try {
      const response = await trustAPI.getMySummary();
      setTrustSummary(response.data?.summary || null);
      setPendingFeedback(response.data?.pending_feedback || []);
    } catch (error) {
      console.error('Failed to fetch trust summary:', error);
    }
  };

  useEffect(() => {
    const loadUnreadCount = async () => {
      try {
        const response = await conversationsAPI.getUnreadCount();
        setUnreadCount(response.data?.unread_count || 0);
      } catch (error) {
        console.error('Failed to fetch unread count:', error);
      }
    };

    loadUnreadCount();
    loadTrust();
    const intervalId = window.setInterval(loadUnreadCount, 5000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  return (
    <div className="container-custom py-8">
      {pendingFeedback.length > 0 && (
        <div className="mb-8">
          <PendingFeedbackSection
            pendingFeedback={pendingFeedback}
            onFeedbackSubmitted={loadTrust}
          />
        </div>
      )}

      {/* Welcome Section */}
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          Welcome to Dore-to-Dore, {user?.name}!
        </h1>
        <p className="text-lg text-gray-600 mb-6">
          How would you like to help the Vanderbilt community today?
        </p>

        <div className="mb-6 flex justify-center">
          <button
            onClick={() => navigate('/messages')}
            className="relative flex items-center gap-3 rounded-xl bg-white px-6 py-3 text-gray-800 shadow-md transition-shadow hover:shadow-lg"
          >
            <svg
              className="h-6 w-6 text-purple-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <span className="font-semibold">Messages</span>
            {unreadCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* Report Blockage CTA */}
        <div className="inline-flex flex-col items-center gap-2">
          <p className="text-sm text-gray-500">Spotted a road hazard or accident nearby?</p>
          <Link
            to="/report-blockage"
            className="btn-primary bg-red-600 hover:bg-red-700 py-3 px-8"
          >
            ⚠️ Report Road Hazard
          </Link>
        </div>
      </div>

      {/* Main Action Buttons */}
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {/* I Can Help Button */}
        <button
          onClick={() => navigate('/volunteer')}
          className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-500 to-green-600 p-8 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
        >
          <div className="relative z-10">
            <div className="mb-4">
              <svg
                className="w-20 h-20 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </div>
            <h2 className="text-3xl font-bold mb-3">I Can Help</h2>
            <p className="text-green-100 text-lg">
              Offer resources, help, or services to those in need
            </p>
          </div>
          <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-green-500 transform scale-0 group-hover:scale-100 transition-transform duration-300"></div>
        </button>

        {/* I Need Help Button */}
        <button
          onClick={() => navigate('/need-help')}
          className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-8 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
        >
          <div className="relative z-10">
            <div className="mb-4">
              <svg
                className="w-20 h-20 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </div>
            <h2 className="text-3xl font-bold mb-3">I Need Help</h2>
            <p className="text-blue-100 text-lg">
              Request resources, assistance, or support from the community
            </p>
          </div>
          <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-blue-500 transform scale-0 group-hover:scale-100 transition-transform duration-300"></div>
        </button>
      </div>

      <div className="max-w-4xl mx-auto mb-12">
        <TrustSummary summary={trustSummary} title="Your Impact" />
      </div>

      {/* Info Section for Developer 2 */}
      <div className="max-w-4xl mx-auto">
        <div className="card bg-gray-50 border-2 border-dashed border-gray-300">
          <h3 className="text-xl font-semibold text-gray-700 mb-4 text-center">
            Additional Features Coming Soon
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center text-sm text-gray-600">
            <div className="p-4">
              <svg
                className="w-12 h-12 mx-auto mb-2 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                />
              </svg>
              <p className="font-medium">Interactive Map</p>
              <p className="text-xs text-gray-500 mt-1">Developer 2</p>
            </div>
            <div className="p-4">
              <svg
                className="w-12 h-12 mx-auto mb-2 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <p className="font-medium">Blockage Reports</p>
              <p className="text-xs text-gray-500 mt-1">Developer 2</p>
            </div>
            <div className="p-4">
              <svg
                className="w-12 h-12 mx-auto mb-2 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              <p className="font-medium">Weather Alerts</p>
              <p className="text-xs text-gray-500 mt-1">Developer 2</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

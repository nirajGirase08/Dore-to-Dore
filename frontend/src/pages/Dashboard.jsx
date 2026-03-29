import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { conversationsAPI, trustAPI } from '../services/api';
import PendingFeedbackSection from '../components/shared/PendingFeedbackSection';
import TrustSummary from '../components/shared/TrustSummary';
import MapView from '../components/crisis/MapView';

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

      {/* Top bar — buttons pinned to top right */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-800 mb-1">
            Welcome to Dore-to-Dore, {user?.name}!
          </h1>
          <p className="text-lg text-gray-600">
            How would you like to help the Vanderbilt community today?
          </p>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Report Hazard */}
          <Link
            to="/report-blockage"
            className="flex items-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 px-4 py-2.5 text-white font-semibold text-sm shadow-md transition-colors"
          >
            <span>⚠️</span>
            <span>Report Hazard</span>
          </Link>

          {/* Messages */}
          <button
            onClick={() => navigate('/messages')}
            className="relative flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-gray-800 shadow-md transition-shadow hover:shadow-lg border border-gray-100"
          >
            <svg className="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="font-semibold text-sm">Messages</span>
            {unreadCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
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

      {/* Crisis Map */}
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Nashville Crisis Map</h2>
            <p className="text-sm text-gray-500 mt-1">
              Active road hazards · Updates every 30 seconds
            </p>
          </div>
          <Link to="/report-blockage" className="btn-secondary text-sm py-2 px-4">
            View All Hazards →
          </Link>
        </div>
        <MapView />
        {/* Map legend */}
        <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-600">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-full bg-blue-500"></span> Your location
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-full bg-red-700"></span> Critical hazard
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-full bg-red-500"></span> High hazard
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-full bg-orange-500"></span> Medium hazard
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-full bg-green-600"></span> Low hazard
          </span>
          <span className="flex items-center gap-1.5">
            🏥 Hospital
          </span>
          <span className="flex items-center gap-1.5">
            🩺 Urgent Care / Clinic
          </span>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

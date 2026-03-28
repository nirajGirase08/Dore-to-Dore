import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [quickNavOpen, setQuickNavOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const { bellNotifications, unreadCount, markRead, markAllRead } = useNotifications();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="bg-primary-600 text-white shadow-lg">
      <div className="container-custom">
        <div className="flex justify-between items-center h-16">
          {/* Left Side: Quick Nav + Logo */}
          <div className="flex items-center space-x-4">
            {/* Quick Navigation Accordion (Hamburger Menu) */}
            <div className="relative">
              <button
                onClick={() => setQuickNavOpen(!quickNavOpen)}
                className="p-2 hover:bg-primary-700 rounded-lg transition-colors flex items-center space-x-2"
                title="Quick Navigation"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
                <span className="text-sm hidden sm:inline">Quick Nav</span>
              </button>

              {/* Dropdown Menu */}
              {quickNavOpen && (
                <>
                  {/* Backdrop */}
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setQuickNavOpen(false)}
                  ></div>

                  {/* Menu */}
                  <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-xl z-20 py-2">
                    <div className="px-4 py-2 border-b border-gray-200">
                      <p className="text-xs font-semibold text-gray-500 uppercase">
                        Quick Navigation
                      </p>
                    </div>

                    <Link
                      to="/dashboard"
                      onClick={() => setQuickNavOpen(false)}
                      className={`flex items-center px-4 py-3 hover:bg-gray-50 transition-colors ${
                        location.pathname === '/dashboard' ? 'bg-blue-50' : ''
                      }`}
                    >
                      <svg
                        className="w-5 h-5 mr-3 text-gray-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                        />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-gray-800">Dashboard</p>
                        <p className="text-xs text-gray-500">Home page</p>
                      </div>
                    </Link>

                    <Link
                      to="/volunteer"
                      onClick={() => setQuickNavOpen(false)}
                      className={`flex items-center px-4 py-3 hover:bg-gray-50 transition-colors ${
                        location.pathname === '/volunteer' ? 'bg-green-50' : ''
                      }`}
                    >
                      <svg
                        className="w-5 h-5 mr-3 text-green-600"
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
                      <div>
                        <p className="text-sm font-medium text-gray-800">Volunteer</p>
                        <p className="text-xs text-gray-500">Offer help & resources</p>
                      </div>
                    </Link>

                    <Link
                      to="/need-help"
                      onClick={() => setQuickNavOpen(false)}
                      className={`flex items-center px-4 py-3 hover:bg-gray-50 transition-colors ${
                        location.pathname === '/need-help' ? 'bg-blue-50' : ''
                      }`}
                    >
                      <svg
                        className="w-5 h-5 mr-3 text-blue-600"
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
                      <div>
                        <p className="text-sm font-medium text-gray-800">I Need Help</p>
                        <p className="text-xs text-gray-500">Request assistance</p>
                      </div>
                    </Link>

                    <Link
                      to="/messages"
                      onClick={() => setQuickNavOpen(false)}
                      className={`flex items-center px-4 py-3 hover:bg-gray-50 transition-colors ${
                        location.pathname.startsWith('/messages') ? 'bg-purple-50' : ''
                      }`}
                    >
                      <svg
                        className="w-5 h-5 mr-3 text-purple-600"
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
                      <div>
                        <p className="text-sm font-medium text-gray-800">Messages</p>
                        <p className="text-xs text-gray-500">View conversations</p>
                      </div>
                    </Link>

                    {/* DEV1: Add your additional pages here */}
                    {/* DEV2: Add your pages here */}
                  </div>
                </>
              )}
            </div>

            {/* Logo/Brand */}
            <Link to="/dashboard" className="flex items-center space-x-2">
              <div className="text-xl md:text-2xl font-bold">Crisis Connect</div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link
              to="/dashboard"
              className="hover:text-primary-200 transition-colors"
            >
              Dashboard
            </Link>
            <Link
              to="/volunteer"
              className="hover:text-primary-200 transition-colors"
            >
              Volunteer
            </Link>
            <Link
              to="/need-help"
              className="hover:text-primary-200 transition-colors"
            >
              I Need Help
            </Link>

            {/* DEV1: Add your navigation links here */}
            {/*
            <Link
              to="/search"
              className="hover:text-primary-200 transition-colors"
            >
              Search
            </Link>
            <Link
              to="/messages"
              className="hover:text-primary-200 transition-colors"
            >
              Messages
            </Link>
            */}

            {/* DEV2: Navigation links */}
            <Link
              to="/report-blockage"
              className="hover:text-primary-200 transition-colors"
            >
              ⚠️ Road Hazards
            </Link>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setBellOpen(!bellOpen)}
                className="relative p-2 hover:bg-primary-700 rounded-lg transition-colors"
                title="Notifications"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {bellOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setBellOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-xl z-20 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
                      <p className="text-sm font-semibold text-gray-700">
                        Nearby Blockages {bellNotifications.length > 0 && `(${bellNotifications.length})`}
                      </p>
                      {bellNotifications.length > 0 && (
                        <button
                          onClick={() => { markAllRead(); setBellOpen(false); }}
                          className="text-xs text-primary-600 hover:underline"
                        >
                          Clear all
                        </button>
                      )}
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {bellNotifications.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-6">No nearby blockage alerts</p>
                      ) : (
                        bellNotifications.map((n) => (
                          <div key={n.notification_id} className="flex items-start gap-3 px-4 py-3 border-b border-gray-100 hover:bg-gray-50">
                            <span className="text-lg mt-0.5">🚧</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-800">{n.title}</p>
                              {n.message && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>}
                            </div>
                            <button
                              onClick={() => markRead(n.notification_id)}
                              className="text-gray-400 hover:text-gray-600 text-lg leading-none flex-shrink-0"
                            >
                              ×
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* User menu */}
            <div className="flex items-center space-x-4 border-l border-primary-500 pl-6">
              <span className="text-sm">{user?.name}</span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-primary-700 hover:bg-primary-800 rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {mobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-3">
            <Link
              to="/dashboard"
              className="block hover:text-primary-200 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Dashboard
            </Link>
            <Link
              to="/volunteer"
              className="block hover:text-primary-200 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Volunteer
            </Link>
            <Link
              to="/need-help"
              className="block hover:text-primary-200 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              I Need Help
            </Link>

            {/* DEV1: Add your mobile navigation links here */}
            {/* DEV2: Mobile navigation */}
            <Link
              to="/report-blockage"
              className="block hover:text-primary-200 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              ⚠️ Road Hazards
            </Link>

            <div className="pt-3 border-t border-primary-500">
              <div className="text-sm mb-2">{user?.name}</div>
              <button
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
                className="px-4 py-2 bg-primary-700 hover:bg-primary-800 rounded-lg transition-colors w-full text-left"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

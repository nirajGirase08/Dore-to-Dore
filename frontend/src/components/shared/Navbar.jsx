import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import vandyLogo from '../../../../images/vandy_logo.png';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [quickNavOpen, setQuickNavOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { bellNotifications, unreadCount, markRead, markAllRead } = useNotifications();
  const navClassName = 'bg-[#b49248] text-[#181511] shadow-lg';
  const hoverButtonClass = 'hover:bg-[#dccca9]';
  const activeButtonClass = 'bg-[#dccca9]';
  const dividerClass = 'border-[#feeeb6]/60';
  const userMenuHoverClass = 'hover:bg-[#dccca9]';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className={navClassName}>
      <div className="mx-auto max-w-7xl px-4 sm:px-5">
        <div className="flex justify-between items-center h-20">
          {/* Left Side: Menu + Brand */}
          <div className="flex items-center gap-2.5">
            {/* Quick Navigation Accordion (Hamburger Menu) */}
            <div className="relative">
              <button
                onClick={() => setQuickNavOpen(!quickNavOpen)}
                className={`flex h-10 w-10 items-center justify-center rounded-2xl border border-[#feeeb6]/70 bg-[#e9e0cf] shadow-sm transition-colors ${hoverButtonClass}`}
                title="Navigation"
                aria-label="Open navigation menu"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 7h14M5 12h14M5 17h14"
                  />
                </svg>
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

                    <Link
                      to="/dashboard"
                      onClick={() => setQuickNavOpen(false)}
                      className={`block px-4 py-3 hover:bg-gray-50 transition-colors ${
                        location.pathname === '/dashboard' ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-800">Dashboard</p>
                        <p className="text-xs text-gray-500">Home page</p>
                      </div>
                    </Link>

                    <Link
                      to="/volunteer"
                      onClick={() => setQuickNavOpen(false)}
                      className={`block px-4 py-3 hover:bg-gray-50 transition-colors ${
                        location.pathname === '/volunteer' ? 'bg-green-50' : ''
                      }`}
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-800">I Can Help</p>
                        <p className="text-xs text-gray-500">Share support and resources</p>
                      </div>
                    </Link>

                    <Link
                      to="/need-help"
                      onClick={() => setQuickNavOpen(false)}
                      className={`block px-4 py-3 hover:bg-gray-50 transition-colors ${
                        location.pathname === '/need-help' ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-800">I Need Help</p>
                        <p className="text-xs text-gray-500">Request assistance</p>
                      </div>
                    </Link>

                    <Link
                      to="/messages"
                      onClick={() => setQuickNavOpen(false)}
                      className={`block px-4 py-3 hover:bg-gray-50 transition-colors ${
                        location.pathname.startsWith('/messages') ? 'bg-purple-50' : ''
                      }`}
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-800">Messages</p>
                        <p className="text-xs text-gray-500">View conversations</p>
                      </div>
                    </Link>

                    <Link
                      to="/rides"
                      onClick={() => setQuickNavOpen(false)}
                      className={`block px-4 py-3 hover:bg-gray-50 transition-colors ${
                        location.pathname.startsWith('/rides') ? 'bg-red-50' : ''
                      }`}
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-800">Community Rides</p>
                        <p className="text-xs text-gray-500">Coordinate volunteer transportation support</p>
                      </div>
                    </Link>

                    <Link
                      to="/report-blockage"
                      onClick={() => setQuickNavOpen(false)}
                      className={`block px-4 py-3 hover:bg-gray-50 transition-colors ${
                        location.pathname === '/report-blockage' ? 'bg-orange-50' : ''
                      }`}
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-800">Report Hazard</p>
                        <p className="text-xs text-gray-500">View and report road hazards</p>
                      </div>
                    </Link>

                    {/* DEV1: Add your additional pages here */}
                    {/* DEV2: Add your pages here */}
                  </div>
                </>
              )}
            </div>

            {/* Logo/Brand */}
            <Link to="/dashboard" className="flex items-center">
              <div className="relative flex flex-col items-center justify-center">
                <img
                  src={vandyLogo}
                  alt="Vanderbilt logo"
                  className="h-7 w-auto object-contain md:h-8"
                />
                <svg
                  className="-mt-0.5 h-10 w-[168px] overflow-visible"
                  viewBox="0 0 220 64"
                  aria-hidden="true"
                >
                  <path id="dore-curve" d="M12 12 Q110 62 208 12" fill="transparent" />
                  <text fill="currentColor" fontFamily="'Libre Caslon Text', Georgia, serif" fontSize="29" fontWeight="700" letterSpacing="0.015em">
                    <textPath href="#dore-curve" startOffset="50%" textAnchor="middle" method="align" spacing="auto">
                      Dore-to-Dore
                    </textPath>
                  </text>
                </svg>
              </div>
            </Link>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-3">
            <button
              onClick={() => navigate('/rides')}
              className={`p-2 rounded-lg transition-colors ${
                location.pathname.startsWith('/rides') ? activeButtonClass : hoverButtonClass
              }`}
              title="Community Rides"
              aria-label="Community Rides"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <circle cx="12" cy="12" r="9" strokeWidth={2} />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v5" />
                <circle cx="12" cy="16.5" r="0.75" fill="currentColor" stroke="none" />
              </svg>
            </button>

            {/* Alerts */}
            <div className="relative">
              <button
                onClick={() => setBellOpen(!bellOpen)}
                className={`relative p-2 rounded-lg transition-colors ${hoverButtonClass}`}
                title="Alerts"
                aria-label="Alerts"
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
                        Alerts {bellNotifications.length > 0 && `(${bellNotifications.length})`}
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
                        <p className="text-sm text-gray-500 text-center py-6">No active alerts</p>
                      ) : (
                        bellNotifications.map((n) => (
                          <div key={n.notification_id} className="flex items-start gap-3 px-4 py-3 border-b border-gray-100 hover:bg-gray-50">
                            <span className="mt-0.5 h-2.5 w-2.5 rounded-full bg-[#a1842f]"></span>
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

            <button
              onClick={() => navigate('/messages')}
              className={`relative p-2 rounded-lg transition-colors ${hoverButtonClass}`}
              title="Messages"
              aria-label="Messages"
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
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </button>

            {/* User menu */}
            <div className={`flex items-center space-x-4 border-l pl-6 ${dividerClass}`}>
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${userMenuHoverClass}`}
                >
                  {user?.profile_image_url ? (
                    <img
                      src={user.profile_image_url}
                      alt={`${user?.name || 'User'} avatar`}
                      className="h-8 w-8 rounded-full object-cover ring-2 ring-primary-300"
                    />
                  ) : (
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-800 text-xs font-bold text-white">
                      {(user?.name || 'U').charAt(0).toUpperCase()}
                    </span>
                  )}
                  <span>{user?.name}</span>
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 top-full z-20 mt-2 w-60 overflow-hidden rounded-lg bg-white shadow-xl">
                      <div className="border-b border-gray-100 px-4 py-3">
                        <div className="flex items-center gap-3">
                          {user?.profile_image_url ? (
                            <img
                              src={user.profile_image_url}
                              alt={`${user?.name || 'User'} avatar`}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-700">
                              {(user?.name || 'U').charAt(0).toUpperCase()}
                            </span>
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                            <p className="truncate text-xs text-gray-500">{user?.email}</p>
                          </div>
                        </div>
                      </div>

                      <Link
                        to="/profile"
                        onClick={() => setUserMenuOpen(false)}
                        className="block px-4 py-3 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                      >
                        Profile
                      </Link>

                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          handleLogout();
                        }}
                        className="block w-full px-4 py-3 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50"
                      >
                        Logout
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden flex h-11 w-11 items-center justify-center rounded-2xl border border-[#feeeb6]/70 bg-[#e9e0cf] shadow-sm"
            aria-label="Toggle mobile navigation"
          >
            <svg
              className="h-5 w-5"
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
              I Can Help
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
              to="/rides"
              className="block hover:text-primary-200 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Community Rides
            </Link>
            <Link
              to="/report-blockage"
              className="block hover:text-primary-200 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Road Hazards
            </Link>

            <div className="pt-3 border-t border-primary-500">
              <Link
                to="/profile"
                className="mb-3 block text-sm hover:text-primary-200 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {user?.name}
              </Link>
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

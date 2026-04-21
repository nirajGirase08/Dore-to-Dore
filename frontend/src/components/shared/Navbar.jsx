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

  /* Bell dropdown — shared between mobile and desktop */
  const BellDropdown = () => (
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
  );

  return (
    <>
    <nav className={navClassName}>
      <div className="w-full px-4 sm:px-6">
        <div className="flex justify-between items-center h-20">
          {/* Left Side: Mobile menu button + Brand */}
          <div className="flex items-center gap-2.5">
            {/* Mobile menu button — left side (only one burger icon) */}
            <button
              onClick={() => { setMobileMenuOpen(!mobileMenuOpen); setBellOpen(false); setUserMenuOpen(false); }}
              style={{ touchAction: 'manipulation' }}
              className={`flex h-10 w-10 items-center justify-center rounded-2xl border border-[#feeeb6]/70 bg-[#e9e0cf] shadow-sm transition-colors ${hoverButtonClass}`}
              aria-label="Toggle mobile navigation"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>

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

          {/* Right Side Actions */}
          <div className="flex items-center gap-1">
            {/*
              Mobile: show only Bell + Messages (Rides is in hamburger menu).
              Desktop: show Rides + Bell + Messages.
              Each button has touch-action:manipulation to prevent double-tap zoom
              and enough padding for a comfortable touch target.
            */}

            {/* Rides — desktop only; on mobile it lives inside the hamburger menu */}
            <button
              onClick={() => navigate('/rides')}
              style={{ touchAction: 'manipulation' }}
              className={`hidden md:flex p-2 rounded-lg transition-colors ${
                location.pathname.startsWith('/rides') ? activeButtonClass : hoverButtonClass
              }`}
              title="Emergency Rides"
              aria-label="Emergency Rides"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </button>

            {/* Bell — visible on all sizes, spaced well */}
            <div className="relative">
              <button
                onClick={() => { setBellOpen(!bellOpen); setMobileMenuOpen(false); }}
                style={{ touchAction: 'manipulation' }}
                className={`relative p-2.5 rounded-lg transition-colors ${hoverButtonClass}`}
                title="Alerts"
                aria-label="Alerts"
              >
                <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              {bellOpen && <BellDropdown />}
            </div>

            {/* Messages — visible on all sizes */}
            <button
              onClick={() => navigate('/messages')}
              style={{ touchAction: 'manipulation' }}
              className={`p-2.5 rounded-lg transition-colors ${
                location.pathname.startsWith('/messages') ? activeButtonClass : hoverButtonClass
              }`}
              title="Messages"
              aria-label="Messages"
            >
              <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </button>

            {/* User avatar — desktop shows dropdown, mobile just navigates to profile */}
            <div className={`relative flex items-center md:border-l md:pl-4 ${dividerClass}`}>
              {/* Desktop: avatar + dropdown */}
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                title="Account"
                aria-label="Account menu"
                className={`hidden md:flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${userMenuHoverClass}`}
              >
                {user?.profile_image_url ? (
                  <img src={user.profile_image_url} alt={`${user?.name || 'User'} avatar`} className="h-8 w-8 rounded-full object-cover ring-2 ring-[#dccca9]" />
                ) : (
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#181511] text-xs font-bold text-[#f8f4ec]">
                    {(user?.name || 'U').charAt(0).toUpperCase()}
                  </span>
                )}
                <span>{user?.name}</span>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Mobile: avatar taps to profile directly */}
              <button
                onClick={() => navigate('/profile')}
                style={{ touchAction: 'manipulation' }}
                title="Profile"
                aria-label="Profile"
                className={`md:hidden flex items-center rounded-lg p-1 transition-colors ${userMenuHoverClass}`}
              >
                {user?.profile_image_url ? (
                  <img src={user.profile_image_url} alt={`${user?.name || 'User'} avatar`} className="h-8 w-8 rounded-full object-cover ring-2 ring-[#dccca9]" />
                ) : (
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#181511] text-xs font-bold text-[#f8f4ec]">
                    {(user?.name || 'U').charAt(0).toUpperCase()}
                  </span>
                )}
              </button>

              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 top-full z-20 mt-2 w-60 overflow-hidden rounded-lg bg-white shadow-xl">
                    <div className="border-b border-gray-100 px-4 py-3">
                      <div className="flex items-center gap-3">
                        {user?.profile_image_url ? (
                          <img src={user.profile_image_url} alt={`${user?.name || 'User'} avatar`} className="h-10 w-10 rounded-full object-cover" />
                        ) : (
                          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e9e0cf] text-sm font-bold text-[#181511]">
                            {(user?.name || 'U').charAt(0).toUpperCase()}
                          </span>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                          <p className="truncate text-xs text-gray-500">{user?.email}</p>
                        </div>
                      </div>
                    </div>
                    <Link to="/profile" onClick={() => setUserMenuOpen(false)} className="block px-4 py-3 text-sm text-gray-700 transition-colors hover:bg-gray-50">
                      Profile
                    </Link>
                    <button
                      onClick={() => { setUserMenuOpen(false); handleLogout(); }}
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

      </div>
    </nav>

    {/* Mobile menu — fixed dropdown box with blurred backdrop */}
    {mobileMenuOpen && (
      <>
        {/* Backdrop */}
        <div
          className="fixed inset-0 z-40 bg-black/25 backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />

        {/* Dropdown box */}
        <div className="fixed top-[82px] left-4 z-50 w-72 rounded-2xl bg-[#f8f4ec] shadow-2xl border border-[#e9e0cf] overflow-hidden">
          <nav className="p-2 space-y-0.5">
            {[
              { to: '/dashboard', label: 'Dashboard', sub: 'Home overview' },
              { to: '/volunteer', label: 'I Can Help', sub: 'Share resources' },
              { to: '/need-help', label: 'I Need Help', sub: 'Request support' },
              { to: '/messages', label: 'Messages', sub: 'Your conversations' },
              { to: '/rides', label: 'Community Rides', sub: 'Transportation support' },
              { to: '/report-blockage', label: 'Road Hazards', sub: 'Report & view hazards' },
            ].map(({ to, label, sub }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors ${
                  location.pathname === to || (to !== '/dashboard' && location.pathname.startsWith(to))
                    ? 'bg-[#dccca9]/70 font-semibold'
                    : 'hover:bg-[#dccca9]/40'
                }`}
              >
                <div>
                  <p className="text-sm font-medium text-[#181511]">{label}</p>
                  <p className="text-xs text-[#7c6248]">{sub}</p>
                </div>
                {(location.pathname === to || (to !== '/dashboard' && location.pathname.startsWith(to))) && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#181511]" />
                )}
              </Link>
            ))}
          </nav>

          {/* Logout */}
          <div className="border-t border-[#e9e0cf] p-2">
            <button
              onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
              className="w-full flex items-center px-3 py-2.5 rounded-xl hover:bg-[#dccca9]/40 transition-colors text-left"
            >
              <svg className="w-5 h-5 mr-3 text-[#7c6248]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <p className="text-sm font-medium text-[#181511]">Logout</p>
            </button>
          </div>
        </div>
      </>
    )}
    </>
  );
};

export default Navbar;

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="bg-primary-600 text-white shadow-lg">
      <div className="container-custom">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <Link to="/dashboard" className="flex items-center space-x-2">
            <div className="text-2xl font-bold">Crisis Connect</div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link
              to="/dashboard"
              className="hover:text-primary-200 transition-colors"
            >
              Dashboard
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
              to="/requests"
              className="hover:text-primary-200 transition-colors"
            >
              Requests
            </Link>
            <Link
              to="/offers"
              className="hover:text-primary-200 transition-colors"
            >
              Offers
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
              🚧 Blockages
            </Link>

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

            {/* DEV1: Add your mobile navigation links here */}
            {/* DEV2: Mobile navigation */}
            <Link
              to="/report-blockage"
              className="block hover:text-primary-200 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              🚧 Blockages
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

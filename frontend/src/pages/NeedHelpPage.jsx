import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const NeedHelpPage = () => {
  const { user } = useAuth();

  return (
    <div className="container-custom py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Request Help & Resources</h1>
        <p className="text-gray-600">
          Connect with volunteers who can provide the support you need
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <button className="card hover:shadow-lg transition-shadow bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200">
          <div className="flex items-center space-x-4">
            <div className="bg-blue-500 text-white p-4 rounded-full">
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </div>
            <div className="text-left">
              <h3 className="text-xl font-semibold text-gray-800">Create New Request</h3>
              <p className="text-sm text-gray-600">Tell us what you need</p>
            </div>
          </div>
        </button>

        <button className="card hover:shadow-lg transition-shadow bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200">
          <div className="flex items-center space-x-4">
            <div className="bg-green-500 text-white p-4 rounded-full">
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <div className="text-left">
              <h3 className="text-xl font-semibold text-gray-800">Search Available Help</h3>
              <p className="text-sm text-gray-600">Browse volunteer offers</p>
            </div>
          </div>
        </button>
      </div>

      {/* My Requests Section */}
      <div className="card mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">My Active Requests</h2>
        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
          <svg
            className="w-16 h-16 mx-auto mb-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <p className="text-gray-600 mb-4">You haven't created any requests yet</p>
          <button className="btn-primary">Create Your First Request</button>
        </div>
      </div>

      {/* Matching Offers */}
      <div className="card mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Available Help Matching Your Needs
        </h2>
        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
          <svg
            className="w-16 h-16 mx-auto mb-4 text-gray-400"
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
          <p className="text-gray-600 mb-2">
            Smart matching will show offers that match your requests
          </p>
          <p className="text-sm text-gray-500">Developer 1: Implement matching algorithm</p>
        </div>
      </div>

      {/* Urgent Needs Indicator */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card bg-yellow-50 border-2 border-yellow-200 text-center">
          <div className="text-yellow-600 mb-2">
            <svg
              className="w-10 h-10 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h4 className="font-semibold text-gray-800">Priority: Normal</h4>
          <p className="text-xs text-gray-600 mt-1">Standard response time</p>
        </div>

        <div className="card bg-orange-50 border-2 border-orange-200 text-center">
          <div className="text-orange-600 mb-2">
            <svg
              className="w-10 h-10 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <h4 className="font-semibold text-gray-800">Priority: High</h4>
          <p className="text-xs text-gray-600 mt-1">Faster response needed</p>
        </div>

        <div className="card bg-red-50 border-2 border-red-200 text-center">
          <div className="text-red-600 mb-2">
            <svg
              className="w-10 h-10 mx-auto"
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
          </div>
          <h4 className="font-semibold text-gray-800">Priority: Critical</h4>
          <p className="text-xs text-gray-600 mt-1">Immediate assistance</p>
        </div>
      </div>

      {/* Developer Notes */}
      <div className="mt-8 card bg-blue-50 border-2 border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">
          Developer 1: Features to Implement
        </h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Create Request form (with multiple resource types, quantities, urgency level)</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>View and manage my requests (edit, delete, mark items as fulfilled)</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Browse all available offers with search and filters</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Smart matching algorithm to suggest relevant offers</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Contact volunteers via messaging system</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default NeedHelpPage;

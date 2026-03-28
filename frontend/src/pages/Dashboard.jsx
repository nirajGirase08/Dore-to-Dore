import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div className="container-custom py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Welcome back, {user?.name}!
        </h1>
        <p className="text-gray-600">
          Manage your requests, offers, and connect with the Vanderbilt community.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <h3 className="text-lg font-semibold mb-2">Active Requests</h3>
          <p className="text-4xl font-bold">0</p>
          <p className="text-sm text-blue-100 mt-2">Items you need help with</p>
        </div>

        <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
          <h3 className="text-lg font-semibold mb-2">Active Offers</h3>
          <p className="text-4xl font-bold">0</p>
          <p className="text-sm text-green-100 mt-2">Resources you're sharing</p>
        </div>

        <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <h3 className="text-lg font-semibold mb-2">Messages</h3>
          <p className="text-4xl font-bold">0</p>
          <p className="text-sm text-purple-100 mt-2">Unread conversations</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="btn-primary">
            Create Request
          </button>
          <button className="btn-primary">
            Create Offer
          </button>
          <button className="btn-secondary">
            Search Help
          </button>
          <button className="btn-secondary">
            View Messages
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-4">
          These buttons will be functional once you implement the respective features
        </p>
      </div>

      {/* Developer Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Developer 1 Section */}
        <div className="card border-2 border-primary-200">
          <h2 className="text-xl font-bold text-primary-700 mb-4">
            Developer 1 - Next Steps
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-start">
              <span className="text-primary-600 mr-2">✓</span>
              <span>Authentication system completed</span>
            </div>
            <div className="flex items-start">
              <span className="text-gray-400 mr-2">○</span>
              <span>Implement Request CRUD (models, routes, components)</span>
            </div>
            <div className="flex items-start">
              <span className="text-gray-400 mr-2">○</span>
              <span>Implement Offer CRUD (models, routes, components)</span>
            </div>
            <div className="flex items-start">
              <span className="text-gray-400 mr-2">○</span>
              <span>Build Search & Filtering system</span>
            </div>
            <div className="flex items-start">
              <span className="text-gray-400 mr-2">○</span>
              <span>Implement Smart Matching Algorithm</span>
            </div>
            <div className="flex items-start">
              <span className="text-gray-400 mr-2">○</span>
              <span>Build Messaging System</span>
            </div>
          </div>
        </div>

        {/* Developer 2 Section */}
        <div className="card border-2 border-green-200">
          <h2 className="text-xl font-bold text-green-700 mb-4">
            Developer 2 - Next Steps
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-start">
              <span className="text-green-600 mr-2">✓</span>
              <span>Authentication middleware available for use</span>
            </div>
            <div className="flex items-start">
              <span className="text-gray-400 mr-2">○</span>
              <span>Integrate Weather Alert API</span>
            </div>
            <div className="flex items-start">
              <span className="text-gray-400 mr-2">○</span>
              <span>Build Blockage Reporting System</span>
            </div>
            <div className="flex items-start">
              <span className="text-gray-400 mr-2">○</span>
              <span>Implement Map Visualization</span>
            </div>
            <div className="flex items-start">
              <span className="text-gray-400 mr-2">○</span>
              <span>Add Route Display functionality</span>
            </div>
            <div className="flex items-start">
              <span className="text-gray-400 mr-2">○</span>
              <span>Build Authority Notification System</span>
            </div>
          </div>
        </div>
      </div>

      {/* User Info (for testing) */}
      <div className="card mt-6 bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-700 mb-3">Your Profile</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-gray-600 font-medium">Email:</span> {user?.email}
          </div>
          <div>
            <span className="text-gray-600 font-medium">User Type:</span> {user?.user_type}
          </div>
          <div>
            <span className="text-gray-600 font-medium">Phone:</span> {user?.phone || 'Not provided'}
          </div>
          <div>
            <span className="text-gray-600 font-medium">Location:</span>{' '}
            {user?.location_address || 'Not provided'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const VolunteerPage = () => {
  const { user } = useAuth();

  return (
    <div className="container-custom py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Volunteer & Offer Help</h1>
        <p className="text-gray-600">
          Share your resources and help community members in need
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </div>
            <div className="text-left">
              <h3 className="text-xl font-semibold text-gray-800">Create New Offer</h3>
              <p className="text-sm text-gray-600">Share what you can provide</p>
            </div>
          </div>
        </button>

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
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <div className="text-left">
              <h3 className="text-xl font-semibold text-gray-800">Browse Requests</h3>
              <p className="text-sm text-gray-600">Find people who need help</p>
            </div>
          </div>
        </button>
      </div>

      {/* My Offers Section */}
      <div className="card mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">My Active Offers</h2>
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
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
          <p className="text-gray-600 mb-4">You haven't created any offers yet</p>
          <button className="btn-primary">Create Your First Offer</button>
        </div>
      </div>

      {/* Matching Requests */}
      <div className="card">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Requests You Might Help With
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
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <p className="text-gray-600 mb-2">
            Smart matching will show requests that match your offers
          </p>
          <p className="text-sm text-gray-500">Developer 1: Implement matching algorithm</p>
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
            <span>Create Offer form (with multiple resource types, quantities, availability)</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>View and manage my offers (edit, delete, mark as fulfilled)</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Browse all active requests with search and filters</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Smart matching algorithm to suggest relevant requests</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Contact requesters via messaging system</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default VolunteerPage;

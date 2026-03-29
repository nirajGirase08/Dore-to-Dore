import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { offersAPI, requestsAPI, conversationsAPI } from '../services/api';
import CreateOfferModal from '../components/marketplace/CreateOfferModal';
import OfferCard from '../components/marketplace/OfferCard';
import RequestCard from '../components/marketplace/RequestCard';
import PeopleMap, { RADIUS_OPTIONS, haversineKm } from '../components/crisis/PeopleMap';

const ACTIVE_STATUSES = ['active', 'in_progress', 'partially_claimed'];
const FULFILLED_STATUSES = ['fulfilled'];

const VolunteerPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [myOffers, setMyOffers] = useState([]);
  const [allRequests, setAllRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBrowseRequests, setShowBrowseRequests] = useState(false);
  const [error, setError] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [radiusKm, setRadiusKm] = useState(RADIUS_OPTIONS[2].km); // default 5 miles

  // Fetch user's offers
  const fetchMyOffers = async () => {
    try {
      const response = await offersAPI.getMy();
      setMyOffers(response.data || []);
    } catch (err) {
      console.error('Failed to fetch offers:', err);
      setError('Failed to load your offers');
    }
  };

  // Fetch all requests for browsing
  const fetchAllRequests = async () => {
    try {
      const response = await requestsAPI.getAll();
      const requests = response.data || [];

      // Filter out current user's own requests
      const otherUsersRequests = requests.filter(request => request.user_id !== user?.user_id);

      // Calculate match scores for each request
      const requestsWithScores = otherUsersRequests.map(request => {
        const matchScore = calculateMatchScore(request);
        return { ...request, matchScore };
      });

      // Sort by match score (highest first)
      requestsWithScores.sort((a, b) => b.matchScore - a.matchScore);
      setAllRequests(requestsWithScores);
    } catch (err) {
      console.error('Failed to fetch requests:', err);
      setError('Failed to load requests');
    }
  };

  // Fetch unread message count
  const fetchUnreadCount = async () => {
    try {
      const response = await conversationsAPI.getUnreadCount();
      setUnreadCount(response.data?.unread_count || 0);
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
    }
  };

  // Simple matching algorithm based on resource overlap
  const calculateMatchScore = (request) => {
    if (!myOffers.length || !request.items?.length) return 0;

    // Get all resource types from user's offers
    const offeredResources = new Set();
    myOffers.forEach(offer => {
      offer.items?.forEach(item => {
        if (item.quantity_remaining > 0) {
          offeredResources.add(item.resource_type);
        }
      });
    });

    // Get all resource types from the request
    const requestedResources = request.items.map(item => item.resource_type);

    // Calculate overlap
    const matchingResources = requestedResources.filter(resource =>
      offeredResources.has(resource)
    );

    // Calculate score as percentage of matched resources
    const overlapScore = (matchingResources.length / requestedResources.length) * 100;

    // Boost score based on urgency
    const urgencyBoost = {
      critical: 20,
      high: 10,
      medium: 5,
      low: 0,
    }[request.urgency_level || 'medium'];

    // Calculate distance factor (placeholder - would use real geolocation)
    // For now, just return overlap + urgency boost
    const finalScore = Math.min(100, Math.round(overlapScore + urgencyBoost));

    return finalScore;
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchMyOffers(), fetchAllRequests(), fetchUnreadCount()]);
      setLoading(false);
    };
    loadData();
  }, []);

  // Refresh data when window gains focus (user comes back to tab)
  useEffect(() => {
    const handleFocus = () => {
      fetchMyOffers();
      fetchUnreadCount();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const handleOfferCreated = () => {
    fetchMyOffers();
    fetchAllRequests(); // Refresh to recalculate match scores
  };

  const handleEditOffer = (offer) => {
    // TODO: Open edit modal
    alert('Edit functionality coming soon!');
  };

  const handleFulfillOfferItem = async (offer, item) => {
    if (window.confirm(`Mark "${item.resource_type}" in "${offer.title}" as fulfilled?`)) {
      try {
        await offersAPI.fulfillItem(offer.offer_id, item.item_id);
        await Promise.all([fetchMyOffers(), fetchAllRequests()]);
      } catch (err) {
        console.error('Failed to mark offer item as fulfilled:', err);
        alert('Failed to update item. Please try again.');
      }
    }
  };

  const handleContactRequest = async (request) => {
    try {
      console.log('Contacting request:', {
        request_id: request.request_id,
        user_id: request.user_id,
        title: request.title
      });

      const initialMessage = `Hi! I'd like to help with "${request.title}"`;

      const response = await conversationsAPI.createOrGet(
        request.user_id,
        initialMessage,
        null, // no offer_id
        request.request_id // pass request_id
      );

      console.log('Conversation created:', response);

      // Navigate to the conversation
      navigate(`/messages/${response.data.conversation_id}`);
    } catch (err) {
      console.error('Failed to start conversation:', err);
      alert('Failed to start conversation. Please try again.');
    }
  };

  const activeOffers = myOffers.filter((offer) => ACTIVE_STATUSES.includes(offer.status));
  const fulfilledOffers = myOffers.filter((offer) => FULFILLED_STATUSES.includes(offer.status));
  const otherOffers = myOffers.filter(
    (offer) => !ACTIVE_STATUSES.includes(offer.status)
      && !FULFILLED_STATUSES.includes(offer.status)
  );

  if (loading) {
    return (
      <div className="container-custom py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-custom py-8">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Volunteer & Offer Help</h1>
          <p className="text-gray-600">
            Share your resources and help community members in need
          </p>
        </div>

        {/* Messages Button with Badge */}
        <button
          onClick={() => navigate('/messages')}
          className="relative flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-md"
        >
          <svg
            className="w-5 h-5"
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
          <span className="font-medium">Messages</span>
          {unreadCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <button
          onClick={() => setShowCreateModal(true)}
          className="card hover:shadow-lg transition-shadow bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200"
        >
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

        <button
          onClick={() => setShowBrowseRequests(!showBrowseRequests)}
          className="card hover:shadow-lg transition-shadow bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200"
        >
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
              <h3 className="text-xl font-semibold text-gray-800">
                {showBrowseRequests ? 'Hide' : 'Browse'} Requests
              </h3>
              <p className="text-sm text-gray-600">Find people who need help</p>
            </div>
          </div>
        </button>
      </div>

      {/* My Offers Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">My Offers</h2>
        {myOffers.length === 0 ? (
          <div className="card bg-gray-50 border-2 border-dashed border-gray-300">
            <div className="text-center py-12">
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
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn-primary"
              >
                Create Your First Offer
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Active Offers */}
            {activeOffers.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm mr-2">
                    Active
                  </span>
                  <span className="text-gray-500">({activeOffers.length})</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activeOffers.map((offer) => (
                    <OfferCard
                      key={offer.offer_id}
                      offer={offer}
                      showContact={false}
                      onEdit={handleEditOffer}
                      onFulfillItem={handleFulfillOfferItem}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Fulfilled Offers */}
            {fulfilledOffers.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
                  <span className="bg-gray-200 text-gray-800 px-3 py-1 rounded-full text-sm mr-2">
                    Fulfilled
                  </span>
                  <span className="text-gray-500">({fulfilledOffers.length})</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {fulfilledOffers.map((offer) => (
                    <OfferCard
                      key={offer.offer_id}
                      offer={offer}
                      showContact={false}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Other Status Offers */}
            {otherOffers.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
                  <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm mr-2">
                    Other
                  </span>
                  <span className="text-gray-500">({otherOffers.length})</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {otherOffers.map((offer) => (
                    <OfferCard
                      key={offer.offer_id}
                      offer={offer}
                      showContact={false}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Browse Requests Section */}
      {showBrowseRequests && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Requests You Can Help With
            {myOffers.length > 0 && (
              <span className="text-sm font-normal text-gray-600 ml-2">
                (Sorted by match score)
              </span>
            )}
          </h2>
          {allRequests.length === 0 ? (
            <div className="card bg-gray-50 border-2 border-dashed border-gray-300">
              <div className="text-center py-12">
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
                <p className="text-gray-600">No active requests at the moment</p>
              </div>
            </div>
          ) : (
            <>
              {myOffers.length > 0 && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <span className="font-semibold">💡 Tip:</span> Requests are sorted by how well they match your offers.
                    Higher match scores (80%+) are shown first!
                  </p>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {allRequests.map((request) => (
                  <RequestCard
                    key={request.request_id}
                    request={request}
                    matchScore={myOffers.length > 0 ? request.matchScore : undefined}
                    onContact={handleContactRequest}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* People in Need — Map */}
      {(() => {
        const userLat = user?.location_lat ? parseFloat(user.location_lat) : null;
        const userLng = user?.location_lng ? parseFloat(user.location_lng) : null;

        const visibleOnMap = allRequests.filter((r) => {
          const u = r.user;
          if (!u?.location_lat || !u?.location_lng) return false;
          if (radiusKm === null) return true;
          if (!userLat || !userLng) return true;
          return haversineKm(userLat, userLng, parseFloat(u.location_lat), parseFloat(u.location_lng)) <= radiusKm;
        });

        const selected = RADIUS_OPTIONS.find((o) => o.km === radiusKm) || RADIUS_OPTIONS[2];

        return (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">People in Need Nearby</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  {visibleOnMap.length} person{visibleOnMap.length !== 1 ? 's' : ''} within {selected.label}
                </p>
              </div>
              <select
                className="input-field w-auto"
                value={radiusKm ?? ''}
                onChange={(e) =>
                  setRadiusKm(e.target.value === '' ? null : parseFloat(e.target.value))
                }
              >
                {RADIUS_OPTIONS.map((r) => (
                  <option key={r.label} value={r.km ?? ''}>{r.label}</option>
                ))}
              </select>
            </div>
            <PeopleMap
              people={visibleOnMap}
              mode="volunteer"
              userLat={userLat}
              userLng={userLng}
              radiusKm={radiusKm}
              radiusLabel={selected.label}
            />
            <p className="text-xs text-gray-500 mt-2 flex items-center gap-3">
              <span className="inline-flex items-center gap-1"><span style={{color:'#3b82f6',fontWeight:700}}>▲</span> Person in need</span>
              <span>📍 Your location</span>
              <span className="text-blue-400">— — Radius boundary</span>
            </p>
          </div>
        );
      })()}

      {/* Create Offer Modal */}
      <CreateOfferModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleOfferCreated}
      />
    </div>
  );
};

export default VolunteerPage;

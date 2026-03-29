import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { requestsAPI, offersAPI, conversationsAPI } from '../services/api';
import CreateRequestModal from '../components/marketplace/CreateRequestModal';
import RequestCard from '../components/marketplace/RequestCard';
import OfferCard from '../components/marketplace/OfferCard';
import PeopleMap, { RADIUS_OPTIONS, haversineKm } from '../components/crisis/PeopleMap';

const ACTIVE_STATUSES = ['active', 'in_progress', 'partially_fulfilled'];
const FULFILLED_STATUSES = ['fulfilled'];

const NeedHelpPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [myRequests, setMyRequests] = useState([]);
  const [allOffers, setAllOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBrowseOffers, setShowBrowseOffers] = useState(false);
  const [error, setError] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [radiusKm, setRadiusKm] = useState(RADIUS_OPTIONS[2].km); // default 5 miles

  // Fetch user's requests
  const fetchMyRequests = async () => {
    try {
      const response = await requestsAPI.getMy();
      setMyRequests(response.data || []);
    } catch (err) {
      console.error('Failed to fetch requests:', err);
      setError('Failed to load your requests');
    }
  };

  // Fetch all offers for browsing
  const fetchAllOffers = async () => {
    try {
      const response = await offersAPI.getAll();
      const offers = response.data || [];

      // Filter out current user's own offers
      const otherUsersOffers = offers.filter(offer => offer.user_id !== user?.user_id);

      // Calculate match scores for each offer
      const offersWithScores = otherUsersOffers.map(offer => {
        const matchScore = calculateMatchScore(offer);
        return { ...offer, matchScore };
      });

      // Sort by match score (highest first)
      offersWithScores.sort((a, b) => b.matchScore - a.matchScore);
      setAllOffers(offersWithScores);
    } catch (err) {
      console.error('Failed to fetch offers:', err);
      setError('Failed to load offers');
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
  const calculateMatchScore = (offer) => {
    if (!myRequests.length || !offer.items?.length) return 0;

    // Get all resource types from user's requests
    const requestedResources = new Set();
    myRequests.forEach(request => {
      request.items?.forEach(item => {
        if (item.quantity_needed > item.quantity_fulfilled) {
          requestedResources.add(item.resource_type);
        }
      });
    });

    // Get all resource types from the offer
    const offeredResources = offer.items
      .filter(item => item.quantity_remaining > 0)
      .map(item => item.resource_type);

    // Calculate overlap
    const matchingResources = offeredResources.filter(resource =>
      requestedResources.has(resource)
    );

    // Calculate score as percentage of matched resources
    const overlapScore = offeredResources.length > 0
      ? (matchingResources.length / requestedResources.size) * 100
      : 0;

    // Boost score if delivery is available
    const deliveryBoost = offer.delivery_available ? 15 : 0;

    // Boost score based on volunteer reputation
    const reputationBoost = offer.user?.reputation_score > 0
      ? Math.min(10, offer.user.reputation_score)
      : 0;

    // Calculate distance factor (placeholder - would use real geolocation)
    // For now, just return overlap + boosts
    const finalScore = Math.min(100, Math.round(overlapScore + deliveryBoost + reputationBoost));

    return finalScore;
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchMyRequests(), fetchAllOffers(), fetchUnreadCount()]);
      setLoading(false);
    };
    loadData();
  }, []);

  // Refresh data when window gains focus (user comes back to tab)
  useEffect(() => {
    const handleFocus = () => {
      fetchMyRequests();
      fetchUnreadCount();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const handleRequestCreated = () => {
    fetchMyRequests();
    fetchAllOffers(); // Refresh to recalculate match scores
  };

  const handleEditRequest = (request) => {
    // TODO: Open edit modal
    alert('Edit functionality coming soon!');
  };

  const handleFulfillRequestItem = async (request, item) => {
    if (window.confirm(`Mark "${item.resource_type}" in "${request.title}" as fulfilled?`)) {
      try {
        await requestsAPI.fulfillItem(request.request_id, item.item_id);
        await Promise.all([fetchMyRequests(), fetchAllOffers()]);
      } catch (err) {
        console.error('Failed to mark request item as fulfilled:', err);
        alert('Failed to update item. Please try again.');
      }
    }
  };

  const handleContactOffer = async (offer) => {
    try {
      console.log('Contacting offer:', {
        offer_id: offer.offer_id,
        user_id: offer.user_id,
        title: offer.title
      });

      const initialMessage = `Hi! I'm interested in "${offer.title}"`;

      const response = await conversationsAPI.createOrGet(
        offer.user_id,
        initialMessage,
        offer.offer_id, // pass offer_id
        null // no request_id
      );

      console.log('Conversation created:', response);

      // Navigate to the conversation
      navigate(`/messages/${response.data.conversation_id}`);
    } catch (err) {
      console.error('Failed to start conversation:', err);
      alert('Failed to start conversation. Please try again.');
    }
  };

  const activeRequests = myRequests.filter((request) => ACTIVE_STATUSES.includes(request.status));
  const fulfilledRequests = myRequests.filter((request) => FULFILLED_STATUSES.includes(request.status));
  const otherRequests = myRequests.filter(
    (request) => !ACTIVE_STATUSES.includes(request.status)
      && !FULFILLED_STATUSES.includes(request.status)
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
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Request Help & Resources</h1>
          <p className="text-gray-600">
            Connect with volunteers who can provide the support you need
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

        <button
          onClick={() => setShowBrowseOffers(!showBrowseOffers)}
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
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <div className="text-left">
              <h3 className="text-xl font-semibold text-gray-800">
                {showBrowseOffers ? 'Hide' : 'Search'} Available Help
              </h3>
              <p className="text-sm text-gray-600">Browse volunteer offers</p>
            </div>
          </div>
        </button>
      </div>

      {/* My Requests Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">My Requests</h2>
        {myRequests.length === 0 ? (
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
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <p className="text-gray-600 mb-4">You haven't created any requests yet</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn-primary"
              >
                Create Your First Request
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Active Requests */}
            {activeRequests.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm mr-2">
                    Active
                  </span>
                  <span className="text-gray-500">({activeRequests.length})</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activeRequests.map((request) => (
                    <RequestCard
                      key={request.request_id}
                      request={request}
                      showContact={false}
                      onEdit={handleEditRequest}
                      onFulfillItem={handleFulfillRequestItem}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Fulfilled Requests */}
            {fulfilledRequests.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
                  <span className="bg-gray-200 text-gray-800 px-3 py-1 rounded-full text-sm mr-2">
                    Fulfilled
                  </span>
                  <span className="text-gray-500">({fulfilledRequests.length})</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {fulfilledRequests.map((request) => (
                    <RequestCard
                      key={request.request_id}
                      request={request}
                      showContact={false}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Other Status Requests */}
            {otherRequests.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
                  <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm mr-2">
                    Other
                  </span>
                  <span className="text-gray-500">({otherRequests.length})</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {otherRequests.map((request) => (
                    <RequestCard
                      key={request.request_id}
                      request={request}
                      showContact={false}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Browse Offers Section */}
      {showBrowseOffers && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Available Help
            {myRequests.length > 0 && (
              <span className="text-sm font-normal text-gray-600 ml-2">
                (Sorted by match score)
              </span>
            )}
          </h2>
          {allOffers.length === 0 ? (
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
                <p className="text-gray-600">No active offers at the moment</p>
              </div>
            </div>
          ) : (
            <>
              {myRequests.length > 0 && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <span className="font-semibold">💡 Tip:</span> Offers are sorted by how well they match your requests.
                    Higher match scores (80%+) are shown first!
                  </p>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {allOffers.map((offer) => (
                  <OfferCard
                    key={offer.offer_id}
                    offer={offer}
                    onContact={handleContactOffer}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Urgency Level Indicators */}
      {myRequests.length === 0 && (
        <div>
          <h3 className="text-xl font-bold text-gray-800 mb-4">Urgency Levels</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="card bg-gray-50 border-2 border-gray-200 text-center">
              <div className="text-gray-600 mb-2">
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
              <h4 className="font-semibold text-gray-800">Low Priority</h4>
              <p className="text-xs text-gray-600 mt-1">Not urgent</p>
            </div>

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
              <h4 className="font-semibold text-gray-800">Medium Priority</h4>
              <p className="text-xs text-gray-600 mt-1">Needed within a day or two</p>
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
              <h4 className="font-semibold text-gray-800">High Priority</h4>
              <p className="text-xs text-gray-600 mt-1">Urgent, needed soon</p>
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
              <h4 className="font-semibold text-gray-800">Critical</h4>
              <p className="text-xs text-gray-600 mt-1">Immediate assistance needed</p>
            </div>
          </div>
        </div>
      )}

      {/* Volunteers Nearby — Map */}
      {(() => {
        const userLat = user?.location_lat ? parseFloat(user.location_lat) : null;
        const userLng = user?.location_lng ? parseFloat(user.location_lng) : null;

        const visibleOnMap = allOffers.filter((o) => {
          const u = o.user;
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
                <h2 className="text-2xl font-bold text-gray-800">Volunteers Nearby</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  {visibleOnMap.length} volunteer{visibleOnMap.length !== 1 ? 's' : ''} within {selected.label}
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
              mode="need-help"
              userLat={userLat}
              userLng={userLng}
              radiusKm={radiusKm}
              radiusLabel={selected.label}
            />
            <p className="text-xs text-gray-500 mt-2 flex items-center gap-3">
              <span className="inline-flex items-center gap-1"><span style={{color:'#16a34a',fontWeight:700}}>▲</span> Volunteer</span>
              <span>📍 Your location</span>
              <span className="text-blue-400">— — Radius boundary</span>
            </p>
          </div>
        );
      })()}

      {/* Create Request Modal */}
      <CreateRequestModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleRequestCreated}
      />
    </div>
  );
};

export default NeedHelpPage;

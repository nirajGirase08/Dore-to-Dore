import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { offersAPI, requestsAPI, conversationsAPI } from '../services/api';
import CreateOfferModal from '../components/marketplace/CreateOfferModal';
import FulfillmentModal from '../components/marketplace/FulfillmentModal';
import OfferCard from '../components/marketplace/OfferCard';
import RequestCard from '../components/marketplace/RequestCard';
import { rankRequestsForVolunteers } from '../utils/matching';
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
  const [editingOffer, setEditingOffer] = useState(null);
  const [pendingFulfillment, setPendingFulfillment] = useState(null);
  const [error, setError] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [requestSearch, setRequestSearch] = useState('');
  const getActiveOffers = (offers) => offers.filter((offer) => ACTIVE_STATUSES.includes(offer.status));
  const [radiusKm, setRadiusKm] = useState(RADIUS_OPTIONS[2].km); // default 5 miles

  // Fetch user's offers
  const fetchMyOffers = async () => {
    try {
      const response = await offersAPI.getMy();
      const offers = response.data || [];
      setMyOffers(offers);
      return offers;
    } catch (err) {
      console.error('Failed to fetch offers:', err);
      setError('Failed to load your offers');
      return [];
    }
  };

  // Fetch all requests for browsing
  const fetchAllRequests = async (offersForMatching = myOffers) => {
    try {
      const response = await requestsAPI.getAll();
      const requests = response.data || [];

      // Filter out current user's own requests
      const otherUsersRequests = requests.filter(request => request.user_id !== user?.user_id);
      const rankedRequests = rankRequestsForVolunteers({
        requests: otherUsersRequests,
        activeOffers: getActiveOffers(offersForMatching),
        currentUser: user,
      });
      setAllRequests(rankedRequests);
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

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const offers = await fetchMyOffers();
      await Promise.all([fetchAllRequests(offers), fetchUnreadCount()]);
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
    fetchMyOffers().then((offers) => fetchAllRequests(offers));
  };

  const handleEditOffer = (offer) => {
    setEditingOffer(offer);
  };

  const handleViewOffer = (offer) => {
    navigate(`/offers/${offer.offer_id}`);
  };

  const handleViewRequest = (request) => {
    navigate(`/requests/${request.request_id}`);
  };

  const handleFulfillOfferItem = async (offer, item) => {
    setPendingFulfillment({ offer, item });
  };

  const handleConfirmOfferFulfillment = async (payload) => {
    try {
      await offersAPI.fulfillItem(
        pendingFulfillment.offer.offer_id,
        pendingFulfillment.item.item_id,
        payload
      );
      const offers = await fetchMyOffers();
      await fetchAllRequests(offers);
      setPendingFulfillment(null);
    } catch (err) {
      console.error('Failed to mark offer item as fulfilled:', err);
      throw err;
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
  const bestMatchRequests = allRequests.filter((request) => request.matchScore > 0).slice(0, 3);
  const filteredRequests = allRequests.filter((request) => {
    const query = requestSearch.trim().toLowerCase();
    if (!query) return true;

    const searchableText = [
      request.title,
      request.description,
      request.location_address,
      request.user?.name,
      ...(request.items || []).map((item) => `${item.resource_type} ${item.notes || ''}`),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return searchableText.includes(query);
  });

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
          <h1 className="text-3xl font-bold text-gray-800 mb-2">I Can Help</h1>
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
      <div className="grid grid-cols-1 gap-6 mb-8">
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
                      onView={handleViewOffer}
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
                      onView={handleViewOffer}
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
                      onView={handleViewOffer}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {activeOffers.length > 0 && bestMatchRequests.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Best Matches</h2>
          <p className="text-sm text-gray-600 mb-4">
            Ranked by item overlap, gender preference, urgency, and location
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bestMatchRequests.map((request) => (
              <RequestCard
                key={`best-request-${request.request_id}`}
                request={request}
                matchScore={request.matchScore}
                matchDistanceKm={request.matchDistanceKm}
                onContact={handleContactRequest}
                onView={handleViewRequest}
              />
            ))}
          </div>
        </div>
      )}

      <div className="mb-8">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              All Requests You Can Help With
            </h2>
            <p className="text-sm text-gray-600">
              Search and browse all eligible requests, sorted by match score
            </p>
          </div>
          <div className="w-full md:max-w-sm">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search Requests
            </label>
            <input
              type="text"
              value={requestSearch}
              onChange={(e) => setRequestSearch(e.target.value)}
              placeholder="Search by keyword, item, person, or location"
              className="input-field"
            />
          </div>
        </div>
        {filteredRequests.length === 0 ? (
          <div className="card bg-gray-50 border-2 border-dashed border-gray-300">
            <div className="text-center py-12">
              <p className="text-gray-600">No matching requests found</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRequests.map((request) => (
              <RequestCard
                key={request.request_id}
                request={request}
                matchScore={myOffers.length > 0 ? request.matchScore : undefined}
                matchDistanceKm={request.matchDistanceKm}
                onContact={handleContactRequest}
                onView={handleViewRequest}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Offer Modal */}
      <CreateOfferModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleOfferCreated}
      />

      <CreateOfferModal
        isOpen={!!editingOffer}
        onClose={() => setEditingOffer(null)}
        onSuccess={() => {
          setEditingOffer(null);
          handleOfferCreated();
        }}
        initialData={editingOffer}
        mode="edit"
      />

      <FulfillmentModal
        isOpen={!!pendingFulfillment}
        mode="offer"
        entity={pendingFulfillment?.offer}
        item={pendingFulfillment?.item}
        onClose={() => setPendingFulfillment(null)}
        onConfirm={handleConfirmOfferFulfillment}
      />
    </div>
  );
};

export default VolunteerPage;

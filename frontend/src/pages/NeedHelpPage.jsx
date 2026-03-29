import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useDemoContext } from '../contexts/DemoContext';
import { requestsAPI, offersAPI, conversationsAPI } from '../services/api';
import { RESOURCE_TYPES } from '../constants/marketplace';
import AISuggestionModal from '../components/marketplace/AISuggestionModal';
import CreateRequestModal from '../components/marketplace/CreateRequestModal';
import FulfillmentModal from '../components/marketplace/FulfillmentModal';
import RequestCard from '../components/marketplace/RequestCard';
import OfferCard from '../components/marketplace/OfferCard';
import { rankOffersForNeeds } from '../utils/matching';
import PeopleMap, { RADIUS_OPTIONS, haversineKm } from '../components/crisis/PeopleMap';
import DemoContextBanner from '../components/shared/DemoContextBanner';

const ACTIVE_STATUSES = ['active', 'in_progress', 'partially_fulfilled'];
const FULFILLED_STATUSES = ['fulfilled'];

const searchMatches = (query, ...fields) => {
  if (!query) return true;
  const q = query.trim().toLowerCase();
  return fields.filter(Boolean).join(' ').toLowerCase().includes(q);
};

const ChevronIcon = ({ open }) => (
  <svg
    className={`w-5 h-5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const mapSuggestedItemToResourceType = (item) => {
  const normalized = (item || '').toLowerCase().trim();
  const values = RESOURCE_TYPES.map((type) => type.value);

  if (values.includes(normalized)) return normalized;
  if (normalized.includes('food') || normalized.includes('meal')) return 'food';
  if (normalized.includes('water')) return 'water';
  if (normalized.includes('shelter') || normalized.includes('room')) return 'shelter';
  if (normalized.includes('blanket')) return 'blankets';
  if (normalized.includes('cloth')) return 'clothes';
  if (normalized.includes('medical') || normalized.includes('medicine') || normalized.includes('pharmacy')) return 'medical';
  if (normalized.includes('transport') || normalized.includes('ride') || normalized.includes('gas')) return 'transport';
  if (normalized.includes('power') || normalized.includes('charging')) return 'power';
  if (normalized.includes('baby')) return 'baby_care';
  if (normalized.includes('hygiene') || normalized.includes('sanitary')) return 'female_hygiene_products';
  if (normalized.includes('wifi') || normalized.includes('internet')) return 'wifi_access';
  return 'food';
};

const NeedHelpPage = () => {
  const { user } = useAuth();
  const { demoEnabled, demoRange } = useDemoContext();
  const navigate = useNavigate();
  const [myRequests, setMyRequests] = useState([]);
  const [allOffers, setAllOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAISuggestionModal, setShowAISuggestionModal] = useState(false);
  const [aiDraftRequest, setAiDraftRequest] = useState(null);
  const [editingRequest, setEditingRequest] = useState(null);
  const [pendingFulfillment, setPendingFulfillment] = useState(null);
  const [error, setError] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [globalSearch, setGlobalSearch] = useState('');
  const [radiusKm, setRadiusKm] = useState(RADIUS_OPTIONS[2].km); // default 5 miles

  // Collapse states — open by default
  const [showMyRequests, setShowMyRequests] = useState(true);
  const [showBestMatches, setShowBestMatches] = useState(true);
  const [showAllOffers, setShowAllOffers] = useState(true);

  const getActiveRequests = (requests) => requests.filter((request) => ACTIVE_STATUSES.includes(request.status));

  // Fetch user's requests
  const fetchMyRequests = async () => {
    try {
      const response = await requestsAPI.getMy();
      const requests = response.data || [];
      setMyRequests(requests);
      return requests;
    } catch (err) {
      console.error('Failed to fetch requests:', err);
      setError('Failed to load your requests');
      return [];
    }
  };

  // Fetch all offers for browsing
  const fetchAllOffers = async (requestsForMatching = myRequests) => {
    try {
      const response = await offersAPI.getAll();
      const offers = response.data || [];

      // Filter out current user's own offers
      const otherUsersOffers = offers.filter(offer => offer.user_id !== user?.user_id);
      const rankedOffers = rankOffersForNeeds({
        offers: otherUsersOffers,
        activeRequests: getActiveRequests(requestsForMatching),
        currentUser: user,
      });
      setAllOffers(rankedOffers);
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

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const requests = await fetchMyRequests();
      await Promise.all([fetchAllOffers(requests), fetchUnreadCount()]);
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
    setAiDraftRequest(null);
    fetchMyRequests().then((requests) => fetchAllOffers(requests));
  };

  const handleApplyAISuggestion = (suggestion) => {
    setAiDraftRequest({
      title: suggestion.suggested_title || '',
      description: suggestion.suggested_description || '',
      urgency_level: suggestion.suggested_urgency || 'medium',
      location_address: user?.location_address || '',
      location_lat: user?.location_lat || 36.1447,
      location_lng: user?.location_lng || -86.8027,
      target_gender: '',
      items: (suggestion.suggested_items || []).length
        ? suggestion.suggested_items.map((item) => ({
            resource_type: mapSuggestedItemToResourceType(item),
            quantity: 1,
            notes: '',
          }))
        : [{ resource_type: 'food', quantity: 1, notes: '' }],
    });
    setShowAISuggestionModal(false);
    setShowCreateModal(true);
  };

  const handleEditRequest = (request) => {
    setEditingRequest(request);
  };

  const handleViewRequest = (request) => {
    navigate(`/requests/${request.request_id}`);
  };

  const handleViewOffer = (offer) => {
    navigate(`/offers/${offer.offer_id}`);
  };

  const handleFulfillRequestItem = async (request, item) => {
    setPendingFulfillment({ request, item });
  };

  const handleConfirmRequestFulfillment = async (payload) => {
    try {
      await requestsAPI.fulfillItem(
        pendingFulfillment.request.request_id,
        pendingFulfillment.item.item_id,
        payload
      );
      const requests = await fetchMyRequests();
      await fetchAllOffers(requests);
      setPendingFulfillment(null);
    } catch (err) {
      console.error('Failed to mark request item as fulfilled:', err);
      throw err;
    }
  };

  const handleContactOffer = async (offer) => {
    try {
      const initialMessage = `Hi! I'm interested in "${offer.title}"`;
      const response = await conversationsAPI.createOrGet(
        offer.user_id,
        initialMessage,
        offer.offer_id,
        null
      );
      navigate(`/messages/${response.data.conversation_id}`);
    } catch (err) {
      console.error('Failed to start conversation:', err);
      alert('Failed to start conversation. Please try again.');
    }
  };

  const activeRequests = myRequests.filter((request) => ACTIVE_STATUSES.includes(request.status));
  const fulfilledRequests = myRequests.filter((request) => FULFILLED_STATUSES.includes(request.status));
  const otherRequests = myRequests.filter(
    (request) => !ACTIVE_STATUSES.includes(request.status) && !FULFILLED_STATUSES.includes(request.status)
  );

  // Global search filtering
  const filterRequest = (request) => searchMatches(
    globalSearch,
    request.title,
    request.description,
    request.location_address,
    request.user?.name,
    ...(request.items || []).map((i) => `${i.resource_type} ${i.notes || ''}`)
  );
  const filterOffer = (offer) => searchMatches(
    globalSearch,
    offer.title,
    offer.description,
    offer.location_address,
    offer.user?.name,
    ...(offer.items || []).map((i) => `${i.resource_type} ${i.notes || ''}`)
  );

  const filteredActiveRequests = activeRequests.filter(filterRequest);
  const filteredFulfilledRequests = fulfilledRequests.filter(filterRequest);
  const filteredOtherRequests = otherRequests.filter(filterRequest);
  const filteredMyRequests = [...filteredActiveRequests, ...filteredFulfilledRequests, ...filteredOtherRequests];

  const allBestMatchOffers = allOffers.filter((offer) => offer.matchScore > 0).slice(0, 3);
  const filteredBestMatchOffers = allBestMatchOffers.filter(filterOffer);

  const filteredOffers = allOffers.filter(filterOffer);

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
      <div className="page-shell page-need-theme p-6 md:p-8">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">I Need Help</h1>
          <p className="text-gray-600">
            Connect with volunteers who can provide the support you need
          </p>
        </div>

        {/* Messages Button with Badge */}
        <button
          onClick={() => navigate('/messages')}
          className="relative flex items-center space-x-2 px-4 py-2 bg-[#181511] text-[#f8f4ec] rounded-lg hover:bg-[#2a261f] transition-colors shadow-md"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
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

      {/* Global Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            placeholder="Search by keyword, item, location, person name..."
            className="input-field pl-10"
          />
          {globalSearch && (
            <button
              onClick={() => setGlobalSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        {globalSearch && (
          <p className="mt-1.5 text-sm text-gray-500">
            Showing results for <span className="font-medium text-gray-700">"{globalSearch}"</span>
          </p>
        )}
      </div>

      <DemoContextBanner className="mb-6" />

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
                onChange={(e) => setRadiusKm(e.target.value === '' ? null : parseFloat(e.target.value))}
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
              contextLabel={demoEnabled ? demoRange.label : null}
              onUserClick={(clickedUserId, clickedUserName) => {
                const parsedId = parseInt(clickedUserId);
                const userPosts = allOffers.filter((o) => o.user_id === parsedId);
                navigate(`/users/${parsedId}?type=offers`, {
                  state: { posts: userPosts, type: 'offers', userName: clickedUserName },
                });
              }}
            />
            <p className="text-xs text-gray-500 mt-2 flex items-center gap-3">
              <span className="inline-flex items-center gap-1"><span style={{color:'#16a34a',fontWeight:700}}>▲</span> Volunteer</span>
              <span>Your location</span>
              <span className="text-[#7daed3]">Radius boundary</span>
            </p>
          </div>
        );
      })()}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-6 mb-8">
        <button
          onClick={() => {
            setAiDraftRequest(null);
            setShowCreateModal(true);
          }}
          className="card hover:shadow-lg transition-shadow bg-[linear-gradient(135deg,rgba(125,174,211,0.18),rgba(248,244,236,0.95))] border-2 border-[#a9c4db]"
        >
          <div className="flex items-center space-x-4">
            <div className="bg-[#7daed3] text-white p-4 rounded-full">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div className="text-left">
              <h3 className="text-xl font-semibold text-gray-800">Create New Request</h3>
              <p className="text-sm text-gray-600">Tell us what you need</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => setShowAISuggestionModal(true)}
          className="card hover:shadow-lg transition-colors bg-[#e9e0cf] border-2 border-[#dccca9] hover:bg-[#dccca9]"
        >
          <div className="flex items-center space-x-4">
            <div className="bg-[#181511] text-[#e9e0cf] p-4 rounded-full">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6l4 2m4-2a8 8 0 11-16 0 8 8 0 0116 0zm-8-8v2m0 12v2m8-8h-2M6 12H4" />
              </svg>
            </div>
            <div className="text-left">
              <h3 className="text-xl font-semibold text-gray-800">Get AI Generated Suggestions</h3>
              <p className="text-sm text-gray-600">Use nearby conditions and your history to draft a request</p>
            </div>
          </div>
        </button>
      </div>

      {/* My Requests Section */}
      {(!globalSearch || filteredMyRequests.length > 0 || myRequests.length === 0) && (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-800">
            My Requests
            {globalSearch && <span className="ml-2 text-base font-normal text-gray-500">({filteredMyRequests.length})</span>}
          </h2>
          <button
            onClick={() => setShowMyRequests((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            {showMyRequests ? 'Collapse' : 'Expand'}
            <ChevronIcon open={showMyRequests} />
          </button>
        </div>

        {showMyRequests && (
          <>
            {myRequests.length === 0 ? (
              <div className="card bg-gray-50 border-2 border-dashed border-gray-300">
                <div className="text-center py-12">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                  <p className="text-gray-600 mb-4">You haven't created any requests yet</p>
                  <button onClick={() => setShowCreateModal(true)} className="btn-primary">
                    Create Your First Request
                  </button>
                </div>
              </div>
            ) : filteredMyRequests.length === 0 ? (
              <div className="card bg-gray-50 border-2 border-dashed border-gray-300">
                <div className="text-center py-8">
                  <p className="text-gray-500">No requests match your search</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredActiveRequests.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
                      <span className="bg-[#e4eef7] text-[#31546c] px-3 py-1 rounded-full text-sm mr-2">Active</span>
                      <span className="text-gray-500">({filteredActiveRequests.length})</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredActiveRequests.map((request) => (
                        <RequestCard key={request.request_id} request={request} showContact={false}
                          onEdit={handleEditRequest} onFulfillItem={handleFulfillRequestItem} onView={handleViewRequest} />
                      ))}
                    </div>
                  </div>
                )}

                {filteredFulfilledRequests.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
                      <span className="bg-gray-200 text-gray-800 px-3 py-1 rounded-full text-sm mr-2">Fulfilled</span>
                      <span className="text-gray-500">({filteredFulfilledRequests.length})</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredFulfilledRequests.map((request) => (
                        <RequestCard key={request.request_id} request={request} showContact={false} onView={handleViewRequest} />
                      ))}
                    </div>
                  </div>
                )}

                {filteredOtherRequests.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
                      <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm mr-2">Other</span>
                      <span className="text-gray-500">({filteredOtherRequests.length})</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredOtherRequests.map((request) => (
                        <RequestCard key={request.request_id} request={request} showContact={false} onView={handleViewRequest} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
      )}

      {/* Best Matches Section */}
      {activeRequests.length > 0 && allBestMatchOffers.length > 0 && (!globalSearch || filteredBestMatchOffers.length > 0) && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                Best Matches
                {globalSearch && <span className="ml-2 text-base font-normal text-gray-500">({filteredBestMatchOffers.length})</span>}
              </h2>
              <p className="text-sm text-gray-600">Ranked by item overlap, gender preference, urgency, and location</p>
            </div>
            <button
              onClick={() => setShowBestMatches((v) => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              {showBestMatches ? 'Collapse' : 'Expand'}
              <ChevronIcon open={showBestMatches} />
            </button>
          </div>

          {showBestMatches && (
            filteredBestMatchOffers.length === 0 ? (
              <div className="card bg-gray-50 border-2 border-dashed border-gray-300">
                <div className="text-center py-8">
                  <p className="text-gray-500">No best matches for your search</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                {filteredBestMatchOffers.map((offer) => (
                  <OfferCard
                    key={`best-offer-${offer.offer_id}`}
                    offer={offer}
                    matchScore={offer.matchScore}
                    matchDistanceKm={offer.matchDistanceKm}
                    onContact={handleContactOffer}
                    onView={handleViewOffer}
                  />
                ))}
              </div>
            )
          )}
        </div>
      )}

      {/* All Available Help Section */}
      {(!globalSearch || filteredOffers.length > 0) && (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              All Available Help
              {globalSearch && <span className="ml-2 text-base font-normal text-gray-500">({filteredOffers.length})</span>}
            </h2>
            <p className="text-sm text-gray-600">Search and browse all available community support, sorted by match score</p>
          </div>
          <button
            onClick={() => setShowAllOffers((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            {showAllOffers ? 'Collapse' : 'Expand'}
            <ChevronIcon open={showAllOffers} />
          </button>
        </div>

        {showAllOffers && (
          filteredOffers.length === 0 ? (
            <div className="card bg-gray-50 border-2 border-dashed border-gray-300">
              <div className="text-center py-12">
                <p className="text-gray-600">No matching community support found</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {filteredOffers.map((offer) => (
                <OfferCard
                  key={offer.offer_id}
                  offer={offer}
                  matchScore={activeRequests.length > 0 ? offer.matchScore : undefined}
                  matchDistanceKm={offer.matchDistanceKm}
                  onContact={handleContactOffer}
                  onView={handleViewOffer}
                />
              ))}
            </div>
          )
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
                <svg className="w-10 h-10 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="font-semibold text-gray-800">Low Priority</h4>
              <p className="text-xs text-gray-600 mt-1">Not urgent</p>
            </div>

            <div className="card bg-yellow-50 border-2 border-yellow-200 text-center">
              <div className="text-yellow-600 mb-2">
                <svg className="w-10 h-10 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="font-semibold text-gray-800">Medium Priority</h4>
              <p className="text-xs text-gray-600 mt-1">Needed within a day or two</p>
            </div>

            <div className="card bg-orange-50 border-2 border-orange-200 text-center">
              <div className="text-orange-600 mb-2">
                <svg className="w-10 h-10 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h4 className="font-semibold text-gray-800">High Priority</h4>
              <p className="text-xs text-gray-600 mt-1">Urgent, needed soon</p>
            </div>

            <div className="card bg-red-50 border-2 border-red-200 text-center">
              <div className="text-red-600 mb-2">
                <svg className="w-10 h-10 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h4 className="font-semibold text-gray-800">Critical</h4>
              <p className="text-xs text-gray-600 mt-1">Immediate assistance needed</p>
            </div>
          </div>
        </div>
      )}

      {/* Create Request Modal */}
      <CreateRequestModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setAiDraftRequest(null);
        }}
        onSuccess={handleRequestCreated}
        initialData={aiDraftRequest}
      />

      <CreateRequestModal
        isOpen={!!editingRequest}
        onClose={() => setEditingRequest(null)}
        onSuccess={() => {
          setEditingRequest(null);
          handleRequestCreated();
        }}
        initialData={editingRequest}
        mode="edit"
      />

      <FulfillmentModal
        isOpen={!!pendingFulfillment}
        mode="request"
        entity={pendingFulfillment?.request}
        item={pendingFulfillment?.item}
        onClose={() => setPendingFulfillment(null)}
        onConfirm={handleConfirmRequestFulfillment}
      />

      <AISuggestionModal
        key={demoEnabled ? 'historical-context' : 'current-context'}
        isOpen={showAISuggestionModal}
        mode="request"
        onClose={() => setShowAISuggestionModal(false)}
        onApply={handleApplyAISuggestion}
      />
      </div>
    </div>
  );
};

export default NeedHelpPage;

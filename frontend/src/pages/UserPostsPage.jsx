import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation, useSearchParams } from 'react-router-dom';
import { requestsAPI, offersAPI, conversationsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import RequestCard from '../components/marketplace/RequestCard';
import OfferCard from '../components/marketplace/OfferCard';

const UserPostsPage = () => {
  const { userId } = useParams();
  const { state } = useLocation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  // State can be passed from the map click (fast path) or we fetch (direct URL)
  const [posts, setPosts] = useState(state?.posts || null);
  const [type, setType] = useState(state?.type || searchParams.get('type') || 'requests');
  const [userName, setUserName] = useState(state?.userName || '');
  const [loading, setLoading] = useState(!state?.posts);
  const [error, setError] = useState('');

  useEffect(() => {
    // If state was passed from map click, use it directly
    if (state?.posts) {
      setPosts(state.posts);
      setType(state.type || 'requests');
      setUserName(state.userName || '');
      setLoading(false);
      return;
    }

    // Direct URL access — fetch and filter client-side
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const parsedId = parseInt(userId);
        if (type === 'offers') {
          const response = await offersAPI.getAll();
          const all = response.data || [];
          const filtered = all.filter((o) => o.user_id === parsedId);
          setPosts(filtered);
          if (filtered.length > 0) setUserName(filtered[0].user?.name || '');
        } else {
          const response = await requestsAPI.getAll();
          const all = response.data || [];
          const filtered = all.filter((r) => r.user_id === parsedId);
          setPosts(filtered);
          if (filtered.length > 0) setUserName(filtered[0].user?.name || '');
        }
      } catch (err) {
        console.error('Failed to fetch user posts:', err);
        setError('Failed to load posts.');
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [userId, type]);

  const handleContactRequest = async (request) => {
    try {
      const response = await conversationsAPI.createOrGet(
        request.user_id,
        `Hi! I'd like to help with "${request.title}"`,
        null,
        request.request_id
      );
      navigate(`/messages/${response.data.conversation_id}`);
    } catch (err) {
      console.error('Failed to start conversation:', err);
      alert('Failed to start conversation. Please try again.');
    }
  };

  const handleContactOffer = async (offer) => {
    try {
      const response = await conversationsAPI.createOrGet(
        offer.user_id,
        `Hi! I'm interested in "${offer.title}"`,
        offer.offer_id,
        null
      );
      navigate(`/messages/${response.data.conversation_id}`);
    } catch (err) {
      console.error('Failed to start conversation:', err);
      alert('Failed to start conversation. Please try again.');
    }
  };

  const handleViewRequest = (request) => navigate(`/requests/${request.request_id}`);
  const handleViewOffer = (offer) => navigate(`/offers/${offer.offer_id}`);

  const displayName = userName || `User #${userId}`;
  const isRequests = type === 'requests';

  return (
    <div className="container-custom py-8">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
      </div>

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold ${isRequests ? 'bg-blue-500' : 'bg-green-500'}`}>
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">{displayName}</h1>
            <p className="text-gray-500 text-sm">
              {isRequests ? 'Requests for help' : 'Support this person can provide'}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      ) : !posts || posts.length === 0 ? (
        <div className="card bg-gray-50 border-2 border-dashed border-gray-300">
          <div className="text-center py-16">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-gray-500 text-lg">No active {isRequests ? 'requests' : 'support listings'} from {displayName}</p>
          </div>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-4">{posts.length} active {isRequests ? 'request' : 'support listing'}{posts.length !== 1 ? 's' : ''}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isRequests
              ? posts.map((request) => (
                  <RequestCard
                    key={request.request_id}
                    request={request}
                    showContact={request.user_id !== currentUser?.user_id}
                    onContact={handleContactRequest}
                    onView={handleViewRequest}
                  />
                ))
              : posts.map((offer) => (
                  <OfferCard
                    key={offer.offer_id}
                    offer={offer}
                    showContact={offer.user_id !== currentUser?.user_id}
                    onContact={handleContactOffer}
                    onView={handleViewOffer}
                  />
                ))
            }
          </div>
        </>
      )}
    </div>
  );
};

export default UserPostsPage;

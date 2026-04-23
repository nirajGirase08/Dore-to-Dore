import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { conversationsAPI, requestsAPI, trustAPI, resolveImageUrl } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import TrustSummary from '../components/shared/TrustSummary';

const RequestDetailPage = () => {
  const { requestId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [trustSummary, setTrustSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadRequest = async () => {
      setLoading(true);
      try {
        const response = await requestsAPI.getById(requestId);
        const requestData = response.data || null;
        setRequest(requestData);
        if (requestData?.user?.user_id) {
          const trustResponse = await trustAPI.getUserSummary(requestData.user.user_id);
          setTrustSummary(trustResponse.data || null);
        }
      } catch (err) {
        console.error('Failed to fetch request details:', err);
        setError('Failed to load request details.');
      } finally {
        setLoading(false);
      }
    };

    loadRequest();
  }, [requestId]);

  const handleContact = async () => {
    if (!request?.user_id || request.user_id === user?.user_id) {
      return;
    }

    try {
      const response = await conversationsAPI.createOrGet(
        request.user_id,
        `Hi! I'd like to help with "${request.title}"`,
        null,
        request.request_id
      );
      navigate(`/messages/${response.data.conversation_id}`);
    } catch (err) {
      console.error('Failed to start conversation from request detail:', err);
      alert('Failed to start conversation. Please try again.');
    }
  };

  if (loading) {
    return <div className="container-custom py-10 text-gray-600">Loading request...</div>;
  }

  if (error || !request) {
    return <div className="container-custom py-10 text-red-600">{error || 'Request not found.'}</div>;
  }

  return (
    <div className="container-custom py-10">
      <button
        onClick={() => navigate(-1)}
        className="mb-6 text-sm font-semibold text-primary-700 hover:text-primary-800"
      >
        ← Back
      </button>

      <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{request.title}</h1>
              <p className="mt-2 text-sm text-gray-500">Location: {request.location_address}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-orange-100 px-3 py-1 text-sm font-semibold text-orange-800 capitalize">
                {request.urgency_level} urgency
              </span>
              <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-800">
                {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
              </span>
            </div>
          </div>

          {request.description && (
            <p className="mb-6 text-gray-700">{request.description}</p>
          )}

          <div>
            <h2 className="mb-4 text-xl font-semibold text-gray-900">Items Needed</h2>
            <div className="space-y-4">
              {request.items?.map((item) => (
                <div key={item.item_id} className="rounded-xl border border-gray-200 p-4">
                  <div className="flex items-start gap-3">
                    <div>
                      <h3 className="text-lg font-semibold capitalize text-gray-900">
                        {item.resource_type.replaceAll('_', ' ')}
                      </h3>
                      <p className="mt-1 text-sm font-medium text-blue-700">
                        {Math.max(item.quantity_needed - (item.quantity_fulfilled || 0), 0)} needed
                      </p>
                      {item.notes && (
                        <p className="mt-2 text-sm text-gray-600">{item.notes}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">Requester Profile</h2>
          <div className="flex items-center gap-4">
            {request.user?.profile_image_url ? (
              <img
                src={resolveImageUrl(request.user.profile_image_url)}
                alt={`${request.user?.name || 'Requester'} profile`}
                className="h-16 w-16 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 text-xl font-bold text-primary-700">
                {(request.user?.name || 'R').charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-lg font-semibold text-gray-900">{request.user?.name || 'Requester'}</p>
              <p className="text-sm text-gray-500">{request.user?.email}</p>
            </div>
          </div>

          <div className="mt-6 space-y-3 text-sm text-gray-700">
            <p><span className="font-semibold">Contact:</span> {request.user?.phone || 'Not provided'}</p>
            <p><span className="font-semibold">Address:</span> {request.user?.location_address || request.location_address || 'Not provided'}</p>
            <p><span className="font-semibold">Gender:</span> {(request.user?.gender || 'prefer_not_to_answer').replaceAll('_', ' ')}</p>
            <p><span className="font-semibold">Reputation:</span> {request.user?.reputation_score || 0}</p>
          </div>

          <div className="mt-6">
            <TrustSummary summary={trustSummary} title="Requester Trust" variant="dashboard" />
          </div>

          {request.user_id !== user?.user_id && (
            <button
              onClick={handleContact}
              className="btn-primary mt-6 w-full"
            >
              Offer Help
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RequestDetailPage;

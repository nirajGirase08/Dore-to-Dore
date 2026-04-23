import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { conversationsAPI, offersAPI, trustAPI, resolveImageUrl } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import TrustSummary from '../components/shared/TrustSummary';

const OfferDetailPage = () => {
  const { offerId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [offer, setOffer] = useState(null);
  const [trustSummary, setTrustSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadOffer = async () => {
      setLoading(true);
      try {
        const response = await offersAPI.getById(offerId);
        const offerData = response.data || null;
        setOffer(offerData);
        if (offerData?.user?.user_id) {
          const trustResponse = await trustAPI.getUserSummary(offerData.user.user_id);
          setTrustSummary(trustResponse.data || null);
        }
      } catch (err) {
        console.error('Failed to fetch offer details:', err);
        setError('Failed to load offer details.');
      } finally {
        setLoading(false);
      }
    };

    loadOffer();
  }, [offerId]);

  const handleContact = async () => {
    if (!offer?.user_id || offer.user_id === user?.user_id) {
      return;
    }

    try {
      const response = await conversationsAPI.createOrGet(
        offer.user_id,
        `Hi! I'm interested in "${offer.title}"`,
        offer.offer_id,
        null
      );
      navigate(`/messages/${response.data.conversation_id}`);
    } catch (err) {
      console.error('Failed to start conversation from offer detail:', err);
      alert('Failed to start conversation. Please try again.');
    }
  };

  if (loading) {
    return <div className="container-custom py-10 text-gray-600">Loading offer...</div>;
  }

  if (error || !offer) {
    return <div className="container-custom py-10 text-red-600">{error || 'Offer not found.'}</div>;
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
              <h1 className="text-3xl font-bold text-gray-900">{offer.title}</h1>
              <p className="mt-2 text-sm text-gray-500">Location: {offer.location_address}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-800">
                {offer.status.charAt(0).toUpperCase() + offer.status.slice(1)}
              </span>
              {offer.delivery_available && (
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-800">
                  Delivery Available
                </span>
              )}
            </div>
          </div>

          {offer.description && (
            <p className="mb-6 text-gray-700">{offer.description}</p>
          )}

          <div>
            <h2 className="mb-4 text-xl font-semibold text-gray-900">Support Available</h2>
            <div className="space-y-4">
              {offer.items?.map((item) => (
                <div key={item.item_id} className="rounded-xl border border-gray-200 p-4">
                  <div className="flex flex-col gap-4 md:flex-row">
                    {item.image_url ? (
                      <img
                        src={resolveImageUrl(item.image_url)}
                        alt={item.resource_type}
                        className="h-40 w-full rounded-xl object-cover md:w-52"
                      />
                    ) : null}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold capitalize text-gray-900">
                          {item.resource_type.replaceAll('_', ' ')}
                        </h3>
                      </div>
                      <p className="mt-2 text-sm font-medium text-green-700">
                        {item.quantity_remaining} available
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
          <h2 className="mb-4 text-xl font-semibold text-gray-900">Community Helper Profile</h2>
          <div className="flex items-center gap-4">
            {offer.user?.profile_image_url ? (
              <img
                src={resolveImageUrl(offer.user.profile_image_url)}
                alt={`${offer.user?.name || 'Helper'} profile`}
                className="h-16 w-16 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 text-xl font-bold text-primary-700">
                {(offer.user?.name || 'H').charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-lg font-semibold text-gray-900">{offer.user?.name || 'Helper'}</p>
              <p className="text-sm text-gray-500">{offer.user?.email}</p>
            </div>
          </div>

          <div className="mt-6 space-y-3 text-sm text-gray-700">
            <p><span className="font-semibold">Contact:</span> {offer.user?.phone || 'Not provided'}</p>
            <p><span className="font-semibold">Address:</span> {offer.user?.location_address || offer.location_address || 'Not provided'}</p>
            <p><span className="font-semibold">Gender:</span> {(offer.user?.gender || 'prefer_not_to_answer').replaceAll('_', ' ')}</p>
            <p><span className="font-semibold">Reputation:</span> {offer.user?.reputation_score || 0}</p>
          </div>

          <div className="mt-6">
            <TrustSummary summary={trustSummary} title="Helper Trust" variant="dashboard" />
          </div>

          {offer.user_id !== user?.user_id && (
            <button
              onClick={handleContact}
              className="btn-primary mt-6 w-full"
            >
              Contact Helper
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OfferDetailPage;

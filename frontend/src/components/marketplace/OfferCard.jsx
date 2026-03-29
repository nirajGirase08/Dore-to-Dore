import React from 'react';
import { RESOURCE_ICONS } from '../../constants/marketplace';

const OfferCard = ({ offer, showContact = true, onContact, onEdit, onFulfillItem, onView, matchScore, matchDistanceKm }) => {
  return (
    <div
      className={`card relative transition-shadow ${onView ? 'cursor-pointer hover:shadow-lg' : 'hover:shadow-lg'}`}
      onClick={() => onView?.(offer)}
      role={onView ? 'button' : undefined}
      tabIndex={onView ? 0 : undefined}
      onKeyDown={(event) => {
        if (onView && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault();
          onView(offer);
        }
      }}
    >
      {matchScore !== undefined && (
        <div className="absolute top-4 right-4">
          <div className={`px-3 py-1 rounded-full text-xs font-bold ${
            matchScore >= 80 ? 'bg-green-100 text-green-800' :
            matchScore >= 50 ? 'bg-yellow-100 text-yellow-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {matchScore >= 80 && '🎯 '}
            {matchScore}% Match
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="font-bold text-lg text-gray-800">{offer.title}</h3>
          <span className={`inline-block px-2 py-1 text-xs rounded-full mt-1 ${
            offer.status === 'active' ? 'bg-green-100 text-green-800' :
            offer.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
            offer.status === 'fulfilled' ? 'bg-gray-100 text-gray-800' :
            'bg-yellow-100 text-yellow-800'
          }`}>
            {offer.status === 'in_progress' ? 'In Progress' : offer.status.charAt(0).toUpperCase() + offer.status.slice(1)}
          </span>
        </div>
        {offer.delivery_available && (
          <span className="badge badge-success text-xs ml-2">🚚 Delivery</span>
        )}
      </div>

      {/* Description */}
      {offer.description && (
        <p className="text-sm text-gray-600 mb-3">{offer.description}</p>
      )}

      {/* Items */}
      <div className="mb-3">
        <p className="text-xs font-semibold text-gray-700 mb-2">Available Items:</p>
        <div className="space-y-1">
          {offer.items?.map((item) => (
            <div key={item.item_id} className="flex items-center justify-between text-sm">
              <div className="flex-1 pr-3">
                <div className="flex items-start gap-3">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.resource_type}
                      className="h-12 w-12 rounded-lg object-cover"
                    />
                  ) : null}
                  <div>
                    <span>
                      <span className="mr-2">{RESOURCE_ICONS[item.resource_type] || '📦'}</span>
                      <span className="capitalize">{item.resource_type}</span>
                      {item.notes && <span className="text-gray-500 text-xs ml-1">({item.notes})</span>}
                    </span>
                    <div className="mt-1">
                      <span className={`text-xs font-semibold ${
                        item.status === 'given' ? 'text-gray-600' : 'text-green-600'
                      }`}>
                        {item.status === 'given' ? 'Fulfilled' : `${item.quantity_remaining} available`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              {!showContact && onFulfillItem && item.status !== 'given' && (
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    onFulfillItem(offer, item);
                  }}
                  className="px-3 py-1 bg-purple-600 text-white text-xs font-semibold rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Fulfill Item
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Volunteer Info */}
      <div className="border-t pt-3 mt-3">
        <div className="flex items-center justify-between text-sm">
          <div>
            <p className="font-medium text-gray-700">{offer.user?.name || 'Helper'}</p>
            <p className="text-xs text-gray-500">
              📍 {offer.location_address}
            </p>
            {offer.user?.reputation_score > 0 && (
              <p className="text-xs text-yellow-600">
                ⭐ Reputation: {offer.user.reputation_score}
              </p>
            )}
            {offer.target_gender && (
              <p className="text-xs text-purple-600">
                Audience: {offer.target_gender === 'male' ? 'Male only' : 'Female only'}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            {showContact && onContact && (
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  onContact(offer);
                }}
                className="px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors"
              >
                Contact
              </button>
            )}
            {!showContact && (
              <>
                {onEdit && offer.status !== 'fulfilled' && (
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      onEdit(offer);
                    }}
                    className="px-3 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Edit
                  </button>
                )}
              </>
            )}
            {onView && (
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  onView(offer);
                }}
                className="px-3 py-2 bg-gray-100 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-200 transition-colors"
              >
                View Details
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Availability */}
      {offer.available_until && (
        <p className="text-xs text-gray-500 mt-2">
          Available until: {new Date(offer.available_until).toLocaleDateString()}
        </p>
      )}
      {matchDistanceKm !== null && matchDistanceKm !== undefined && (
        <p className="text-xs text-gray-500 mt-1">
          Approx. distance: {matchDistanceKm.toFixed(1)} km
        </p>
      )}
    </div>
  );
};

export default OfferCard;

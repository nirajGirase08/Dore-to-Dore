import React from 'react';
const urgencyColors = {
  low: 'bg-gray-100 text-gray-800 border-gray-300',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  high: 'bg-orange-100 text-orange-800 border-orange-300',
  critical: 'bg-red-100 text-red-800 border-red-300',
};

const urgencyLabels = {
  low: 'Low Priority',
  medium: 'Medium Priority',
  high: 'High Priority',
  critical: 'Critical',
};

const RequestCard = ({ request, showContact = true, onContact, onEdit, onFulfillItem, onView, matchScore, matchDistanceKm }) => {
  return (
    <div
      className={`card relative transition-shadow ${onView ? 'cursor-pointer hover:shadow-lg' : 'hover:shadow-lg'}`}
      onClick={() => onView?.(request)}
      role={onView ? 'button' : undefined}
      tabIndex={onView ? 0 : undefined}
      onKeyDown={(event) => {
        if (onView && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault();
          onView(request);
        }
      }}
    >
      {/* Match Score Badge */}
      {matchScore !== undefined && (
        <div className="absolute top-4 right-4">
          <div className={`px-3 py-1 rounded-full text-xs font-bold ${
            matchScore >= 80 ? 'bg-green-100 text-green-800' :
            matchScore >= 50 ? 'bg-yellow-100 text-yellow-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {matchScore}% Match
          </div>
        </div>
      )}

      {/* Urgency Badge */}
      <div className="mb-3 flex gap-2 flex-wrap">
        <span className={`badge border ${urgencyColors[request.urgency_level || 'medium']}`}>
          {urgencyLabels[request.urgency_level || 'medium']}
        </span>
        <span className={`inline-block px-2 py-1 text-xs rounded-full ${
          request.status === 'active' ? 'bg-green-100 text-green-800' :
          request.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
          request.status === 'fulfilled' ? 'bg-gray-100 text-gray-800' :
          'bg-yellow-100 text-yellow-800'
        }`}>
          {request.status === 'in_progress' ? 'In Progress' : request.status.charAt(0).toUpperCase() + request.status.slice(1)}
        </span>
      </div>

      {/* Header */}
      <h3 className="font-bold text-lg text-gray-800 mb-2">{request.title}</h3>

      {/* Description */}
      {request.description && (
        <p className="text-sm text-gray-600 mb-3">{request.description}</p>
      )}

      {/* Items */}
      <div className="mb-3">
        <p className="text-xs font-semibold text-gray-700 mb-2">Items Needed:</p>
        <div className="space-y-1">
          {request.items?.map((item) => (
            <div key={item.item_id} className="flex items-center justify-between text-sm">
              <div className="flex-1 pr-3">
                <span>
                  <span className="capitalize">{item.resource_type}</span>
                  {item.notes && <span className="text-gray-500 text-xs ml-1">({item.notes})</span>}
                </span>
                <div className="mt-1">
                  <span className={`text-xs font-semibold ${
                    item.status === 'fulfilled' ? 'text-gray-600' : 'text-blue-600'
                  }`}>
                    {item.status === 'fulfilled'
                      ? 'Fulfilled'
                      : `${Math.max(item.quantity_needed - (item.quantity_fulfilled || 0), 0)} needed`}
                  </span>
                </div>
              </div>
              {!showContact && onFulfillItem && item.status !== 'fulfilled' && (
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    onFulfillItem(request, item);
                  }}
                  className="px-3 py-1 bg-[#8BA18E] text-white text-xs font-semibold rounded-lg hover:bg-[#748a77] transition-colors"
                >
                  Fulfill Item
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Requester Info */}
      <div className="border-t pt-3 mt-3">
        <div className="flex items-center justify-between text-sm">
          <div>
            <p className="font-medium text-gray-700">{request.user?.name || 'Requester'}</p>
            <p className="text-xs text-gray-500">
              Location: {request.location_address}
            </p>
            {request.target_gender && (
              <p className="text-xs text-purple-600">
                Audience: {request.target_gender === 'male' ? 'Male only' : 'Female only'}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            {showContact && onContact && (
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  onContact(request);
                }}
                className="px-4 py-2 bg-[#7daed3] text-[#181511] text-sm font-semibold rounded-lg hover:bg-[#6c9cbf] transition-colors"
              >
                Help
              </button>
            )}
            {!showContact && (
              <>
                {onEdit && request.status !== 'fulfilled' && (
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      onEdit(request);
                    }}
                    className="px-3 py-2 bg-[#7c6248] text-white text-sm font-semibold rounded-lg hover:bg-[#654f39] transition-colors"
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
                  onView(request);
                }}
                className="px-3 py-2 bg-gray-100 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-200 transition-colors"
              >
                View Details
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Posted time */}
      <p className="text-xs text-gray-500 mt-2">
        Posted: {new Date(request.created_at).toLocaleDateString()}
      </p>
      {matchDistanceKm !== null && matchDistanceKm !== undefined && (
        <p className="text-xs text-gray-500 mt-1">
          Approx. distance: {matchDistanceKm.toFixed(1)} km
        </p>
      )}
    </div>
  );
};

export default RequestCard;

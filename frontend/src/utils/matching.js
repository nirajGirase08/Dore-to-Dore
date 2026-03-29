const URGENCY_SCORES = {
  critical: 25,
  high: 15,
  medium: 8,
  low: 0,
};

const parseCoordinate = (value) => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const getDistanceKm = (fromLat, fromLng, toLat, toLng) => {
  if ([fromLat, fromLng, toLat, toLng].some((value) => value === null)) {
    return null;
  }

  const earthRadiusKm = 6371;
  const dLat = ((toLat - fromLat) * Math.PI) / 180;
  const dLng = ((toLng - fromLng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2
    + Math.cos((fromLat * Math.PI) / 180)
      * Math.cos((toLat * Math.PI) / 180)
      * Math.sin(dLng / 2) ** 2;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const getDistanceBoost = (distanceKm) => {
  if (distanceKm === null) return 0;
  if (distanceKm <= 1) return 20;
  if (distanceKm <= 3) return 14;
  if (distanceKm <= 8) return 8;
  if (distanceKm <= 15) return 4;
  return 0;
};

const getPendingRequestItems = (request) => (
  request.items?.filter((item) => (item.quantity_needed - (item.quantity_fulfilled || 0)) > 0) || []
);

const getAvailableOfferItems = (offer) => (
  offer.items?.filter((item) => item.quantity_remaining > 0) || []
);

const getResourceSet = (items) => new Set(items.map((item) => item.resource_type));

const getRequestLocation = (request, currentUser) => ({
  lat: parseCoordinate(request.location_lat ?? currentUser?.location_lat),
  lng: parseCoordinate(request.location_lng ?? currentUser?.location_lng),
});

const getOfferLocation = (offer, currentUser) => ({
  lat: parseCoordinate(offer.location_lat ?? currentUser?.location_lat ?? offer.user?.location_lat),
  lng: parseCoordinate(offer.location_lng ?? currentUser?.location_lng ?? offer.user?.location_lng),
});

const hasShelterGenderConstraint = (requests, currentUserGender) => (
  requests.some((request) =>
    request.target_gender
    && request.target_gender === currentUserGender
    && getPendingRequestItems(request).some((item) => item.resource_type === 'shelter')
  )
);

const isShelterOnlyOffer = (offer) => {
  const availableItems = getAvailableOfferItems(offer);
  return availableItems.length > 0 && availableItems.every((item) => item.resource_type === 'shelter');
};

const getRequestGenderBoost = (request, offer) => {
  if (!request.target_gender) return 0;
  return offer.user?.gender === request.target_gender ? 10 : -5;
};

const getOfferGenderBoost = (offer, request, currentUserGender) => {
  if (!offer.target_gender) return 0;
  return offer.target_gender === currentUserGender ? 10 : -5;
};

const scoreOfferAgainstRequest = (offer, request, currentUserGender) => {
  const requestItems = getPendingRequestItems(request);
  const offerItems = getAvailableOfferItems(offer);

  if (!requestItems.length || !offerItems.length) {
    return null;
  }

  const requestResources = getResourceSet(requestItems);
  const offerResources = getResourceSet(offerItems);
  const overlapCount = [...offerResources].filter((resource) => requestResources.has(resource)).length;

  if (!overlapCount) {
    return null;
  }

  const overlapScore = Math.round((overlapCount / requestResources.size) * 50);
  const urgencyScore = URGENCY_SCORES[request.urgency_level] || 0;
  const distanceKm = getDistanceKm(
    parseCoordinate(request.location_lat),
    parseCoordinate(request.location_lng),
    parseCoordinate(offer.location_lat),
    parseCoordinate(offer.location_lng)
  );
  const distanceScore = getDistanceBoost(distanceKm);
  const deliveryBoost = offer.delivery_available ? 6 : 0;
  const reputationBoost = Math.min(6, offer.user?.reputation_score || 0);
  const genderBoost = getRequestGenderBoost(request, offer);

  return {
    score: Math.max(0, Math.min(100, overlapScore + urgencyScore + distanceScore + deliveryBoost + reputationBoost + genderBoost)),
    distanceKm,
    overlapCount,
  };
};

const scoreRequestAgainstOffer = (request, offer, currentUserGender) => {
  const requestItems = getPendingRequestItems(request);
  const offerItems = getAvailableOfferItems(offer);

  if (!requestItems.length || !offerItems.length) {
    return null;
  }

  const requestResources = getResourceSet(requestItems);
  const offerResources = getResourceSet(offerItems);
  const overlapCount = [...requestResources].filter((resource) => offerResources.has(resource)).length;

  if (!overlapCount) {
    return null;
  }

  const overlapScore = Math.round((overlapCount / requestResources.size) * 55);
  const urgencyScore = URGENCY_SCORES[request.urgency_level] || 0;
  const distanceKm = getDistanceKm(
    parseCoordinate(request.location_lat),
    parseCoordinate(request.location_lng),
    parseCoordinate(offer.location_lat),
    parseCoordinate(offer.location_lng)
  );
  const distanceScore = getDistanceBoost(distanceKm);
  const deliveryBoost = offer.delivery_available ? 4 : 0;
  const genderBoost = getOfferGenderBoost(offer, request, currentUserGender);

  return {
    score: Math.max(0, Math.min(100, overlapScore + urgencyScore + distanceScore + deliveryBoost + genderBoost)),
    distanceKm,
    overlapCount,
  };
};

export const rankOffersForNeeds = ({ offers, activeRequests, currentUser }) => {
  const currentUserGender = currentUser?.gender;
  const shouldApplyShelterRule = currentUserGender === 'male' || currentUserGender === 'female'
    ? hasShelterGenderConstraint(activeRequests, currentUserGender)
    : false;

  return offers
    .filter((offer) => {
      if (!shouldApplyShelterRule) {
        return true;
      }

      return !(offer.user?.gender !== currentUserGender && isShelterOnlyOffer(offer));
    })
    .map((offer) => {
      const bestMatch = activeRequests.reduce((best, request) => {
        const candidate = scoreOfferAgainstRequest(offer, request, currentUserGender);
        if (!candidate || (best && best.score >= candidate.score)) {
          return best;
        }
        return { ...candidate, requestId: request.request_id };
      }, null);

      return {
        ...offer,
        matchScore: bestMatch?.score || 0,
        matchDistanceKm: bestMatch?.distanceKm ?? null,
        matchedRequestId: bestMatch?.requestId ?? null,
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore);
};

export const rankRequestsForVolunteers = ({ requests, activeOffers, currentUser }) => (
  requests
    .map((request) => {
      const bestMatch = activeOffers.reduce((best, offer) => {
        const candidate = scoreRequestAgainstOffer(request, offer, currentUser?.gender);
        if (!candidate || (best && best.score >= candidate.score)) {
          return best;
        }
        return { ...candidate, offerId: offer.offer_id };
      }, null);

      return {
        ...request,
        matchScore: bestMatch?.score || 0,
        matchDistanceKm: bestMatch?.distanceKm ?? null,
        matchedOfferId: bestMatch?.offerId ?? null,
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore)
);

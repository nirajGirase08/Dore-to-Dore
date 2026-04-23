import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ridesAPI, conversationsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import ChatWindow from '../components/messaging/ChatWindow';

const STATUS_LABELS = {
  pending:   { label: 'Waiting for a Commodore to respond',   color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-300' },
  accepted:  { label: 'Commodore accepted — heading to you',  color: 'text-blue-600',   bg: 'bg-blue-50 border-blue-300' },
  en_route:  { label: 'Commodore is on the way',              color: 'text-blue-600',   bg: 'bg-blue-50 border-blue-300' },
  picked_up: { label: 'En route to destination',              color: 'text-purple-600', bg: 'bg-purple-50 border-purple-300' },
  completed: { label: 'Support ride completed',               color: 'text-green-600',  bg: 'bg-green-50 border-green-300' },
  cancelled: { label: 'Support ride cancelled',               color: 'text-gray-600',   bg: 'bg-gray-50 border-gray-300' },
};

const URGENCY_COLORS = {
  emergency: 'bg-red-100 text-red-700',
  urgent:    'bg-orange-100 text-orange-700',
  normal:    'bg-blue-100 text-blue-700',
};


const RideTrackingPage = () => {
  const { rideId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [routes, setRoutes] = useState(null);
  const [routesLoading, setRoutesLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Chat
  const [chatLoading, setChatLoading] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatConversation, setChatConversation] = useState(null);

  // Completion feedback (requester only)
  const [feedbackText, setFeedbackText] = useState('');
  const [helpful, setHelpful] = useState(null);           // true | false | null
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [ratingDismissed, setRatingDismissed] = useState(false);

  const mapRef = useRef(null);
  const leafletRef = useRef(null);
  const boundsSetRef = useRef(false);

  const fetchRide = async () => {
    try {
      const response = await ridesAPI.getById(rideId);
      setRide(response.data);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load ride.');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoutes = async () => {
    try {
      const response = await ridesAPI.getRoutes(rideId);
      setRoutes(response.data);
    } catch {
      // routes are optional — fail silently
    } finally {
      setRoutesLoading(false);
    }
  };

  useEffect(() => {
    fetchRide();
    fetchRoutes();
    const rideInterval = setInterval(fetchRide, 4000);
    return () => clearInterval(rideInterval);
  }, [rideId]);

  // Build / update map
  useEffect(() => {
    if (!ride || !mapRef.current) return;

    const pickupLat = parseFloat(ride.pickup_lat);
    const pickupLng = parseFloat(ride.pickup_lng);
    const destLat   = parseFloat(ride.destination_lat);
    const destLng   = parseFloat(ride.destination_lng);

    if (!leafletRef.current) {
      const map = L.map(mapRef.current, { scrollWheelZoom: true });
      leafletRef.current = map;
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);
    }

    const map = leafletRef.current;
    // Remove all non-tile layers (markers, polylines, circle markers)
    map.eachLayer((l) => {
      if (l instanceof L.Marker || l instanceof L.Polyline || l instanceof L.CircleMarker) {
        map.removeLayer(l);
      }
    });

    // Pickup marker
    L.marker([pickupLat, pickupLng], {
      icon: L.divIcon({
        className: '',
        html: '<div style="background:#16a34a;width:14px;height:14px;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.4)"></div>',
        iconSize: [14, 14], iconAnchor: [7, 7],
      }),
    }).addTo(map).bindPopup(`<b>Pickup</b><br>${ride.pickup_address || ''}`);

    // Destination marker
    L.marker([destLat, destLng], {
      icon: L.divIcon({
        className: '',
        html: '<div style="background:#dc2626;width:14px;height:14px;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.4)"></div>',
        iconSize: [14, 14], iconAnchor: [7, 7],
      }),
    }).addTo(map).bindPopup(`<b>Destination</b><br>${ride.destination_address || ''}`);

    if (routes?.length) {
      const primary  = routes[0];
      const altRoute = routes[1] ?? null;

      // Draw alternative first (underneath) so primary renders on top
      if (altRoute) {
        const altCoords = altRoute.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
        L.polyline(altCoords, {
          color: '#16a34a', weight: 5, opacity: 0.8, dashArray: '10 6',
        }).addTo(map).bindPopup(
          `<b>Hazard-free alternative</b><br>${altRoute.distance_km} km · ~${altRoute.duration_min} min`
        );
      }

      // Draw primary route
      const primaryCoords = primary.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
      const primaryColor  = primary.has_blockages ? '#f97316' : '#3b82f6';
      const lineStyle     = primary.is_estimated
        ? { color: primaryColor, weight: 4, opacity: 0.75, dashArray: '12 6' }
        : { color: primaryColor, weight: 6, opacity: 0.9 };
      L.polyline(primaryCoords, lineStyle).addTo(map).bindPopup(
        `<b>${primary.is_estimated ? 'Approximate path' : primary.has_blockages ? 'Route (hazard nearby)' : 'Route'}</b><br>` +
        `${primary.distance_km} km · ~${primary.duration_min} min` +
        (primary.has_blockages
          ? `<br><span style="color:#dc2626">${primary.blockage_warnings.length} hazard(s) near route</span>`
          : '')
      );

      // Hazard markers on primary route
      primary.blockage_warnings?.forEach((w) => {
        L.circleMarker([w.lat, w.lng], {
          radius: 10, color: '#dc2626', fillColor: '#fca5a5', fillOpacity: 0.85, weight: 2,
        })
          .addTo(map)
          .bindPopup(`<b>${w.type?.replace(/_/g, ' ')}</b><br>Severity: ${w.severity}${w.address ? `<br>${w.address}` : ''}`);
      });
    } else if (!routesLoading) {
      // API completely unavailable — draw a visible straight-line path
      L.polyline([[pickupLat, pickupLng], [destLat, destLng]], {
        color: '#3b82f6', weight: 4, opacity: 0.7, dashArray: '12 6',
      }).addTo(map).bindPopup('Approximate path');
    }

    if (!boundsSetRef.current) {
      map.fitBounds([[pickupLat, pickupLng], [destLat, destLng]], { padding: [40, 40] });
      boundsSetRef.current = true;
    }
  }, [ride, routes, routesLoading]);

  useEffect(() => {
    return () => {
      leafletRef.current?.remove();
      leafletRef.current = null;
      boundsSetRef.current = false;
    };
  }, []);

  const handleStatusUpdate = async (newStatus) => {
    setUpdatingStatus(true);
    try {
      await ridesAPI.updateStatus(rideId, newStatus);
      if (newStatus === 'completed') {
        navigate('/rides');
        return;
      }
      await fetchRide();
    } catch (err) {
      alert(err.message || 'Failed to update support ride status.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleOpenChat = async () => {
    const otherUserId = isRequester ? ride.driver_id : ride.requester_id;
    if (!otherUserId) return;
    setChatLoading(true);
    try {
      const result = await conversationsAPI.createOrGet(otherUserId);
      const conv = result?.data;
      if (conv?.conversation_id) {
        setChatConversation(conv);
        setChatOpen(true);
      } else {
        navigate('/messages');
      }
    } catch {
      navigate('/messages');
    } finally {
      setChatLoading(false);
    }
  };

  if (loading) return (
    <div className="container-custom py-8 flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading support ride...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="container-custom py-8">
      <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">{error}</div>
    </div>
  );

  if (!ride) return null;

  const isRequester = ride.requester_id === user?.user_id;
  const isDriver    = ride.driver_id    === user?.user_id;
  const statusInfo  = STATUS_LABELS[ride.status] || STATUS_LABELS.pending;
  const bestRoute   = routes?.[0];
  const otherPerson = isRequester ? ride.driver : ride.requester;
  const canChat     = !!otherPerson && ['accepted', 'en_route', 'picked_up'].includes(ride.status);
  const showCompletionModal = isRequester && ride.status === 'completed' && !ratingDismissed;

  return (
    <div className="container-custom py-8 max-w-4xl mx-auto">

      {/* ── Inline Chat Panel ── */}
      {chatOpen && chatConversation && (
        <>
          <div
            className="fixed inset-0 z-[1100] bg-black/40"
            onClick={() => setChatOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 z-[1200] w-full max-w-md bg-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50 flex-shrink-0">
              <p className="font-semibold text-gray-800 truncate">
                Chat with {otherPerson?.name || 'your ride partner'}
              </p>
              <button
                onClick={() => setChatOpen(false)}
                className="ml-3 flex-shrink-0 p-1.5 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <ChatWindow
                conversation={chatConversation}
                onBack={() => setChatOpen(false)}
                onMessageSent={() => {}}
              />
            </div>
          </div>
        </>
      )}

      {/* ── Completion Modal (requester only) ── */}
      {showCompletionModal && (
        <>
          <div className="fixed inset-0 z-[1100] bg-black/50" />
          <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">You've arrived safely!</h2>
              <p className="text-gray-500 text-sm mb-6">
                Your ride with{' '}
                <span className="font-semibold text-gray-700">{otherPerson?.name || 'your Commodore'}</span>{' '}
                is complete. Thank you for being part of the community.
              </p>

              {!feedbackSubmitted ? (
                <>
                  <p className="text-sm font-semibold text-gray-700 mb-3 text-left">
                    Was this helpful?
                  </p>
                  <div className="flex gap-3 mb-4">
                    <button
                      onClick={() => setHelpful(true)}
                      className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                        helpful === true
                          ? 'bg-green-600 text-white border-green-600'
                          : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setHelpful(false)}
                      className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                        helpful === false
                          ? 'bg-red-500 text-white border-red-500'
                          : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      No
                    </button>
                  </div>
                  <textarea
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="Any comments? (optional)"
                    rows={3}
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-[#b49248] mb-4"
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={() => setFeedbackSubmitted(true)}
                      disabled={helpful === null}
                      className="flex-1 px-4 py-2.5 bg-[#b49248] hover:bg-[#a1842f] text-white font-semibold rounded-xl transition-colors disabled:opacity-40"
                    >
                      Submit
                    </button>
                    <button
                      onClick={() => { setRatingDismissed(true); navigate('/rides'); }}
                      className="px-4 py-2.5 border border-gray-300 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      Skip
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="mb-6 py-4 px-4 bg-green-50 rounded-xl border border-green-100">
                    <p className="font-semibold text-green-700">Thanks for your feedback!</p>
                  </div>
                  <button
                    onClick={() => { setRatingDismissed(true); navigate('/rides'); }}
                    className="w-full px-4 py-3 bg-[#b49248] hover:bg-[#a1842f] text-white font-semibold rounded-xl transition-colors"
                  >
                    Done
                  </button>
                </>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── Header ── */}
      <div className="mb-6 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <h1 className="text-2xl font-bold text-gray-800">Support Ride Request</h1>
        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${URGENCY_COLORS[ride.urgency]}`}>
          {ride.urgency}
        </span>
      </div>

      {/* ── Commodore Helper / Community Member card ── */}
      <div className="card mb-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h3 className="font-semibold text-gray-700 text-lg">
            {isRequester ? 'Your Commodore Helper' : 'Community Member'}
          </h3>
          {canChat && (
            <button
              onClick={handleOpenChat}
              disabled={chatLoading}
              className="flex items-center justify-center w-10 h-10 rounded-lg bg-[#e9e0cf] hover:bg-[#dccca9] text-[#181511] transition-colors disabled:opacity-50"
              title="Open chat"
            >
              {chatLoading ? (
                <div className="w-4 h-4 border-2 border-[#181511] border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              )}
            </button>
          )}
        </div>

        <div className="mt-3">
          {isRequester ? (
            otherPerson ? (
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold text-lg flex-shrink-0">
                  {otherPerson.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-gray-800">{otherPerson.name}</p>
                  {otherPerson.phone && <p className="text-sm text-gray-500">{otherPerson.phone}</p>}
                  <p className="text-xs text-green-600 font-medium mt-0.5">Commodore volunteer</p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No Commodore yet — waiting for someone to accept</p>
            )
          ) : (
            otherPerson ? (
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-lg flex-shrink-0">
                  {otherPerson.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-gray-800">{otherPerson.name}</p>
                  {otherPerson.phone && <p className="text-sm text-gray-500">{otherPerson.phone}</p>}
                  <p className="text-xs text-blue-600 font-medium mt-0.5">Needs a ride</p>
                </div>
              </div>
            ) : null
          )}
        </div>
      </div>

      {/* ── Status banner ── */}
      <div className="mb-6 flex items-center gap-3 rounded-xl border border-[#b7a88c] bg-[#E0D5C0] p-4">
        <div className="text-2xl font-bold text-black capitalize">
          {ride.status === 'picked_up' ? 'Picked Up' : ride.status.replace('_', ' ')}
        </div>
        <div>
          <p className="text-lg font-bold text-black">{statusInfo.label}</p>
          {ride.status === 'pending' && <p className="text-sm text-black">Nearby Commodores have been notified.</p>}
        </div>
      </div>

      {/* ── Driver action buttons ── */}
      {isDriver && (
        <div className="flex flex-wrap gap-3 mb-6">
          {/* Skip en_route — go straight from accepted to picked_up */}
          {(ride.status === 'accepted' || ride.status === 'en_route') && (
            <button
              onClick={() => handleStatusUpdate('picked_up')}
              disabled={updatingStatus}
              className="btn-primary bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
            >
              Rider Aboard
            </button>
          )}
          {ride.status === 'picked_up' && (
            <button
              onClick={() => handleStatusUpdate('completed')}
              disabled={updatingStatus}
              className="btn-primary bg-green-600 hover:bg-green-700 disabled:opacity-50"
            >
              Support ride completed
            </button>
          )}
          {['accepted', 'en_route'].includes(ride.status) && (
            <button
              onClick={() => handleStatusUpdate('cancelled')}
              disabled={updatingStatus}
              className="px-4 py-2 border-2 border-red-300 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50"
            >
              Cancel support ride
            </button>
          )}
        </div>
      )}

      {/* ── Requester cancel button ── */}
      {isRequester && ride.status === 'pending' && (
        <div className="mb-6">
          <button
            onClick={() => handleStatusUpdate('cancelled')}
            disabled={updatingStatus}
            className="px-4 py-2 border-2 border-red-300 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50"
          >
            Cancel support request
          </button>
        </div>
      )}

      {/* ── Rerouting / hazard banners ── */}
      {bestRoute?.has_blockages && routes?.[1] && (
        <div className="mb-3 p-3 rounded-lg border bg-blue-50 border-blue-300 text-sm flex items-start gap-2">
          <div>
            <p className="font-semibold text-blue-800">Hazard on primary route</p>
            <p className="text-blue-700 text-xs mt-0.5">
              {bestRoute.blockage_warnings.length} road hazard(s) detected. A hazard-free alternative is shown in green.
            </p>
          </div>
        </div>
      )}

      {bestRoute?.no_safe_alternative && (
        <div className="mb-3 p-3 rounded-lg border bg-red-50 border-red-300 text-sm flex items-start gap-2">
          <div>
            <p className="font-semibold text-red-800">No hazard-free alternative available</p>
            <p className="text-red-700 text-xs mt-0.5">All available routes pass near a road hazard. Proceed with caution.</p>
          </div>
        </div>
      )}

      {/* ── Route summary ── */}
      {bestRoute && (
        <div className="mb-4 flex flex-wrap items-center gap-4 rounded-lg border border-[#b7a88c] bg-[#E0D5C0] p-3 text-sm text-black">
          <span className="font-semibold">{bestRoute.is_estimated ? 'Approx. route:' : 'Route:'}</span>
          <span>{bestRoute.distance_km} km · ~{bestRoute.duration_min} min{bestRoute.is_estimated ? ' (estimated)' : ''}</span>
          {bestRoute.has_blockages
            ? <span className="font-medium text-orange-700">{bestRoute.blockage_warnings.length} hazard(s) near route</span>
            : <span className="font-medium text-green-700">Route is clear</span>
          }
        </div>
      )}

      {/* ── Map ── */}
      <div className="relative rounded-2xl overflow-hidden shadow-lg border border-gray-200 mb-4 h-52 md:h-72 lg:h-[380px]">
        <div ref={mapRef} style={{ height: '100%', width: '100%' }} />
        {routesLoading && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-white/90 text-xs text-gray-500 px-3 py-1 rounded-full shadow flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            Computing routes…
          </div>
        )}
      </div>

      {/* ── Route legend ── */}
      {routes?.length > 0 && (
        <div className="flex flex-wrap gap-4 mb-6 text-xs text-gray-600">
          {routes[0]?.is_estimated
            ? <span className="flex items-center gap-1.5"><span className="inline-block w-4 h-0 border-t-2 border-dashed border-blue-500"></span> Approx. path</span>
            : <span className="flex items-center gap-1.5"><span className="inline-block w-4 h-1 rounded bg-blue-500"></span> Route</span>
          }
          {!routes[0]?.is_estimated && <span className="flex items-center gap-1.5"><span className="inline-block w-4 h-1 rounded bg-orange-400"></span> Route with hazard</span>}
          {routes[1] && <span className="flex items-center gap-1.5"><span className="inline-block w-4 h-0 border-t-2 border-dashed border-green-600"></span> Hazard-free alt.</span>}
          <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-full bg-green-600"></span> Pickup</span>
          <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-full bg-red-600"></span> Destination</span>
          {bestRoute?.has_blockages && <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-full bg-red-300 border border-red-600"></span> Road hazard</span>}
        </div>
      )}

      {/* ── Trip Details ── */}
      <div className="card mb-6">
        <h3 className="font-semibold text-gray-700 mb-3">Trip Details</h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <span className="text-green-600 mt-0.5 flex-shrink-0">●</span>
            <div>
              <p className="text-xs text-gray-500">Pickup</p>
              <p className="font-medium">{ride.pickup_address || 'Unknown'}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-red-600 mt-0.5 flex-shrink-0">●</span>
            <div>
              <p className="text-xs text-gray-500">Destination</p>
              <p className="font-medium">{ride.destination_address || 'Unknown'}</p>
            </div>
          </div>
          {ride.notes && (
            <div className="flex items-start gap-2">
              <span className="mt-0.5 flex-shrink-0">📝</span>
              <div><p className="text-xs text-gray-500">Notes</p><p>{ride.notes}</p></div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default RideTrackingPage;

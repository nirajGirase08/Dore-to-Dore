import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ridesAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const STATUS_STEPS = ['pending', 'accepted', 'en_route', 'picked_up', 'completed'];
const STATUS_LABELS = {
  pending:   { label: 'Waiting for a volunteer',  color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-300' },
  accepted:  { label: 'Volunteer accepted!',       color: 'text-blue-600',   bg: 'bg-blue-50 border-blue-300' },
  en_route:  { label: 'Driver is on the way',      color: 'text-blue-600',   bg: 'bg-blue-50 border-blue-300' },
  picked_up: { label: 'En route to destination',   color: 'text-purple-600', bg: 'bg-purple-50 border-purple-300' },
  completed: { label: 'Ride completed!',            color: 'text-green-600',  bg: 'bg-green-50 border-green-300' },
  cancelled: { label: 'Ride cancelled',             color: 'text-gray-600',   bg: 'bg-gray-50 border-gray-300' },
};

const URGENCY_COLORS = { emergency: 'bg-red-100 text-red-700', urgent: 'bg-orange-100 text-orange-700', normal: 'bg-blue-100 text-blue-700' };

const RideTrackingPage = () => {
  const { rideId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

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

  useEffect(() => {
    fetchRide();
    const interval = setInterval(fetchRide, 4000);
    return () => clearInterval(interval);
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
    map.eachLayer((l) => { if (l instanceof L.Marker || l instanceof L.Polyline) map.removeLayer(l); });

    // Pickup marker
    L.marker([pickupLat, pickupLng], {
      icon: L.divIcon({
        className: '',
        html: '<div style="background:#16a34a;width:14px;height:14px;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.4)"></div>',
        iconSize: [14, 14], iconAnchor: [7, 7],
      }),
    }).addTo(map).bindPopup(`<b>📍 Pickup</b><br>${ride.pickup_address || ''}`);

    // Destination marker
    L.marker([destLat, destLng], {
      icon: L.divIcon({
        className: '',
        html: '<div style="background:#dc2626;width:14px;height:14px;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.4)"></div>',
        iconSize: [14, 14], iconAnchor: [7, 7],
      }),
    }).addTo(map).bindPopup(`<b>🏁 Destination</b><br>${ride.destination_address || ''}`);

    // Draw routes
    if (ride.routes?.length) {
      ride.routes.forEach((route, idx) => {
        const coords = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
        const isBest = idx === 0;
        L.polyline(coords, {
          color:   isBest ? (route.has_blockages ? '#f97316' : '#3b82f6') : '#94a3b8',
          weight:  isBest ? 5 : 3,
          opacity: isBest ? 0.9 : 0.5,
          dashArray: isBest ? null : '8 6',
        }).addTo(map).bindPopup(
          `<b>Route ${idx + 1}</b> ${isBest ? '(Recommended)' : ''}<br>` +
          `${route.distance_km} km · ${route.duration_min} min` +
          (route.has_blockages ? `<br><span style="color:#dc2626">⚠️ ${route.blockage_warnings.length} hazard(s) nearby</span>` : '')
        );

        // Blockage warning pins on best route
        if (isBest && route.blockage_warnings?.length) {
          route.blockage_warnings.forEach((w) => {
            L.circleMarker([w.lat, w.lng], { radius: 10, color: '#dc2626', fillColor: '#fca5a5', fillOpacity: 0.8, weight: 2 })
              .addTo(map)
              .bindPopup(`<b>⚠️ ${w.type?.replace(/_/g, ' ')}</b><br>Severity: ${w.severity}<br>${w.address || ''}`);
          });
        }
      });
    }

    if (!boundsSetRef.current) {
      map.fitBounds([[pickupLat, pickupLng], [destLat, destLng]], { padding: [40, 40] });
      boundsSetRef.current = true;
    }
  }, [ride]);

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
      await fetchRide();
    } catch (err) {
      alert(err.message || 'Failed to update status.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) return (
    <div className="container-custom py-8 flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading ride...</p>
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
  const bestRoute   = ride.routes?.[0];

  return (
    <div className="container-custom py-8 max-w-4xl mx-auto">
      <div className="mb-6 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <h1 className="text-2xl font-bold text-gray-800">Ride Request</h1>
        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${URGENCY_COLORS[ride.urgency]}`}>
          {ride.urgency}
        </span>
      </div>

      {/* Status banner */}
      <div className={`mb-6 p-4 rounded-xl border-2 ${statusInfo.bg} flex items-center gap-3`}>
        <div className={`text-2xl font-bold ${statusInfo.color}`}>
          {ride.status === 'pending'   && '⏳'}
          {ride.status === 'accepted'  && '✅'}
          {ride.status === 'en_route'  && '🚗'}
          {ride.status === 'picked_up' && '🛣️'}
          {ride.status === 'completed' && '🎉'}
          {ride.status === 'cancelled' && '❌'}
        </div>
        <div>
          <p className={`font-bold text-lg ${statusInfo.color}`}>{statusInfo.label}</p>
          {ride.status === 'pending' && <p className="text-sm text-gray-500">Notified all nearby volunteers — hang tight!</p>}
        </div>
      </div>

      {/* Rerouting / hazard banners */}
      {bestRoute?.rerouted_due_to_hazard && (
        <div className="mb-3 p-3 rounded-lg border bg-blue-50 border-blue-300 text-sm flex items-start gap-2">
          <span className="text-xl">🔀</span>
          <div>
            <p className="font-semibold text-blue-800">Route changed due to road hazard</p>
            <p className="text-blue-700 text-xs mt-0.5">
              The fastest route has a {bestRoute.avoided_hazards.map(h => h.severity).join('/')} severity hazard
              {bestRoute.avoided_hazards[0]?.address ? ` near ${bestRoute.avoided_hazards[0].address}` : ''}.
              A safer alternative has been selected.
            </p>
          </div>
        </div>
      )}

      {bestRoute?.no_safe_alternative && (
        <div className="mb-3 p-3 rounded-lg border bg-red-50 border-red-300 text-sm flex items-start gap-2">
          <span className="text-xl">🚨</span>
          <div>
            <p className="font-semibold text-red-800">No safe alternative available</p>
            <p className="text-red-700 text-xs mt-0.5">
              All available routes pass near a road hazard. Proceed with caution.
            </p>
          </div>
        </div>
      )}

      {/* Route summary */}
      {bestRoute && (
        <div className={`mb-4 p-3 rounded-lg border text-sm flex flex-wrap items-center gap-4 ${
          bestRoute.no_safe_alternative ? 'bg-red-50 border-red-300' :
          bestRoute.has_blockages      ? 'bg-orange-50 border-orange-300' :
                                         'bg-blue-50 border-blue-200'
        }`}>
          <span className="font-semibold">Recommended route:</span>
          <span>{bestRoute.distance_km} km · ~{bestRoute.duration_min} min</span>
          {bestRoute.has_blockages && (
            <span className={`font-medium ${bestRoute.no_safe_alternative ? 'text-red-700' : 'text-orange-700'}`}>
              ⚠️ {bestRoute.blockage_warnings.length} road hazard(s) near route
            </span>
          )}
          {!bestRoute.has_blockages && <span className="text-green-700 font-medium">✅ Route is clear</span>}
        </div>
      )}

      {/* Map */}
      <div className="rounded-2xl overflow-hidden shadow-lg border border-gray-200 mb-6" style={{ height: 380 }}>
        <div ref={mapRef} style={{ height: '100%', width: '100%' }} />
      </div>

      {/* Route legend */}
      {ride.routes?.length > 0 && (
        <div className="flex flex-wrap gap-4 mb-6 text-xs text-gray-600">
          <span className="flex items-center gap-1.5"><span className="inline-block w-4 h-1 rounded bg-blue-500"></span> Best route</span>
          <span className="flex items-center gap-1.5"><span className="inline-block w-4 h-1 rounded bg-orange-400"></span> Route with hazards</span>
          <span className="flex items-center gap-1.5"><span className="inline-block w-4 h-1 rounded bg-slate-400"></span> Alt route</span>
          <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-full bg-green-600"></span> Pickup</span>
          <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-full bg-red-600"></span> Destination</span>
          <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-full bg-red-300 border border-red-600"></span> Road hazard</span>
        </div>
      )}

      {/* Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="card">
          <h3 className="font-semibold text-gray-700 mb-2">Trip Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <span className="text-green-600 mt-0.5">📍</span>
              <div><p className="text-xs text-gray-500">Pickup</p><p className="font-medium">{ride.pickup_address || 'Unknown'}</p></div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-red-600 mt-0.5">🏁</span>
              <div><p className="text-xs text-gray-500">Destination</p><p className="font-medium">{ride.destination_address || 'Unknown'}</p></div>
            </div>
            {ride.notes && (
              <div className="flex items-start gap-2">
                <span className="mt-0.5">📝</span>
                <div><p className="text-xs text-gray-500">Notes</p><p>{ride.notes}</p></div>
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <h3 className="font-semibold text-gray-700 mb-2">{isRequester ? 'Your Driver' : 'Requester'}</h3>
          {isRequester ? (
            ride.driver ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold">
                  {ride.driver.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold">{ride.driver.name}</p>
                  {ride.driver.phone && <p className="text-sm text-gray-500">{ride.driver.phone}</p>}
                </div>
              </div>
            ) : <p className="text-gray-500 text-sm">No driver yet — waiting for a volunteer to accept</p>
          ) : (
            ride.requester && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold">
                  {ride.requester.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold">{ride.requester.name}</p>
                  {ride.requester.phone && <p className="text-sm text-gray-500">{ride.requester.phone}</p>}
                </div>
              </div>
            )
          )}
        </div>
      </div>

      {/* Driver action buttons */}
      {isDriver && (
        <div className="flex flex-wrap gap-3">
          {ride.status === 'accepted' && (
            <button onClick={() => handleStatusUpdate('en_route')} disabled={updatingStatus}
              className="btn-primary bg-blue-600 hover:bg-blue-700 disabled:opacity-50">
              🚗 I'm on my way
            </button>
          )}
          {ride.status === 'en_route' && (
            <button onClick={() => handleStatusUpdate('picked_up')} disabled={updatingStatus}
              className="btn-primary bg-purple-600 hover:bg-purple-700 disabled:opacity-50">
              🙋 Passenger picked up
            </button>
          )}
          {ride.status === 'picked_up' && (
            <button onClick={() => handleStatusUpdate('completed')} disabled={updatingStatus}
              className="btn-primary bg-green-600 hover:bg-green-700 disabled:opacity-50">
              ✅ Ride completed
            </button>
          )}
          {['accepted', 'en_route'].includes(ride.status) && (
            <button onClick={() => handleStatusUpdate('cancelled')} disabled={updatingStatus}
              className="px-4 py-2 border-2 border-red-300 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50">
              Cancel ride
            </button>
          )}
        </div>
      )}

      {/* Requester cancel button */}
      {isRequester && ride.status === 'pending' && (
        <button onClick={() => handleStatusUpdate('cancelled')} disabled={updatingStatus}
          className="px-4 py-2 border-2 border-red-300 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50">
          Cancel request
        </button>
      )}
    </div>
  );
};

export default RideTrackingPage;

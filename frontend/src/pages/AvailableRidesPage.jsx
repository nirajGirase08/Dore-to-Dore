import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ridesAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import EmergencyRideModal from '../components/rides/EmergencyRideModal';

const URGENCY_COLORS = {
  emergency: 'bg-red-100 text-red-700 border-red-300',
  urgent:    'bg-orange-100 text-orange-700 border-orange-300',
  normal:    'bg-blue-100 text-blue-700 border-blue-300',
};

const URGENCY_LABELS = { emergency: 'Emergency', urgent: 'Urgent', normal: 'Normal' };

const STATUS_COLORS = {
  accepted:  'bg-blue-100 text-blue-700',
  en_route:  'bg-blue-100 text-blue-700',
  picked_up: 'bg-purple-100 text-purple-700',
};

const STATUS_LABELS = {
  accepted:  'Accepted',
  en_route:  'On the way',
  picked_up: 'Community member aboard',
};

// Haversine distance in km
const haversineKm = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const AvailableRidesPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [available, setAvailable] = useState([]);
  const [myDriving, setMyDriving] = useState([]);
  const [myRequested, setMyRequested] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [accepting, setAccepting] = useState(null);
  const [volunteerPos, setVolunteerPos] = useState(null);
  const [showEmergencyRideModal, setShowEmergencyRideModal] = useState(false);

  // Get helper location for distance calculation
  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => setVolunteerPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {}
    );
  }, []);

  const fetchAll = useCallback(async () => {
    try {
      const [availRes, drivingRes, myRes] = await Promise.all([
        ridesAPI.getAvailable(),
        ridesAPI.getDriving(),
        ridesAPI.getMy(),
      ]);
      setAvailable(availRes.data || []);
      setMyDriving(drivingRes.data || []);
      setMyRequested(myRes.data || []);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load community rides.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 10000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  const handleAccept = async (rideId) => {
    setAccepting(rideId);
    try {
      await ridesAPI.accept(rideId);
      navigate(`/rides/${rideId}`);
    } catch (err) {
      alert(err.message || 'Failed to accept support ride.');
      setAccepting(null);
    }
  };

  if (loading) return (
    <div className="container-custom py-8 flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading community rides...</p>
      </div>
    </div>
  );

  return (
    <div className="container-custom py-8 max-w-4xl mx-auto">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-1">Community Rides</h1>
          <p className="text-gray-500 text-sm">See where people need transportation support and request a community support ride when needed</p>
        </div>
        <button
          onClick={() => setShowEmergencyRideModal(true)}
          className="flex-shrink-0 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-colors hover:bg-red-700"
        >
          Request Dore Support Ride
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">{error}</div>
      )}

      {/* Rides I’m supporting */}
      {myDriving.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">
            Rides I’m Supporting
            <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">{myDriving.length}</span>
          </h2>
          <div className="space-y-3">
            {myDriving.map((ride) => (
              <div
                key={ride.ride_request_id}
                onClick={() => navigate(`/rides/${ride.ride_request_id}`)}
                className="card cursor-pointer hover:shadow-md transition-shadow border-l-4 border-blue-500"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold border ${URGENCY_COLORS[ride.urgency]}`}>
                        {URGENCY_LABELS[ride.urgency] || ride.urgency}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${STATUS_COLORS[ride.status]}`}>
                        {STATUS_LABELS[ride.status]}
                      </span>
                    </div>
                    <div className="text-sm space-y-1">
                      <p className="text-gray-600"><span className="text-green-600 font-medium">From:</span> {ride.pickup_address || 'Unknown'}</p>
                      <p className="text-gray-600"><span className="text-red-600 font-medium">To:</span> {ride.destination_address || 'Unknown'}</p>
                      {ride.requester && <p className="text-gray-500 text-xs">Community member: <span className="font-medium">{ride.requester.name}</span></p>}
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <span className="text-blue-600 text-sm font-medium">View →</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* My support ride requests */}
      {myRequested.filter(r => ['pending','accepted','en_route','picked_up'].includes(r.status)).length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">My Support Ride Requests</h2>
          <div className="space-y-3">
            {myRequested
              .filter(r => ['pending','accepted','en_route','picked_up'].includes(r.status))
              .map((ride) => (
                <div
                  key={ride.ride_request_id}
                  onClick={() => navigate(`/rides/${ride.ride_request_id}`)}
                  className="card cursor-pointer hover:shadow-md transition-shadow border-l-4 border-gray-300"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold border ${URGENCY_COLORS[ride.urgency]}`}>
                          {URGENCY_LABELS[ride.urgency] || ride.urgency}
                        </span>
                        <span className="text-xs text-gray-500 capitalize">{ride.status.replace('_', ' ')}</span>
                      </div>
                      <p className="text-sm text-gray-600 truncate">
                        {ride.pickup_address} → {ride.destination_address}
                      </p>
                    </div>
                    <span className="text-blue-600 text-sm font-medium flex-shrink-0">Track →</span>
                  </div>
                </div>
              ))}
          </div>
        </section>
      )}

      {/* People needing ride support */}
      <section>
        <h2 className="text-xl font-semibold text-gray-700 mb-4">
          People Needing Ride Support
          {available.length > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded-full">{available.length}</span>
          )}
        </h2>

        {available.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-600 font-medium">No pending support ride requests right now</p>
            <p className="text-gray-400 text-sm mt-1">Check back soon — community members may need transportation support</p>
          </div>
        ) : (
          <div className="space-y-4">
            {available.map((ride) => {
              const distKm = volunteerPos
                ? haversineKm(volunteerPos.lat, volunteerPos.lng, parseFloat(ride.pickup_lat), parseFloat(ride.pickup_lng))
                : null;

              return (
                <div key={ride.ride_request_id} className={`card border-l-4 ${ride.urgency === 'emergency' ? 'border-red-500' : ride.urgency === 'urgent' ? 'border-orange-400' : 'border-blue-400'}`}>
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Header row */}
                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${URGENCY_COLORS[ride.urgency]}`}>
                          {URGENCY_LABELS[ride.urgency] || ride.urgency}
                        </span>
                        {distKm != null && (
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                            {distKm < 1 ? `${Math.round(distKm * 1000)}m` : `${distKm.toFixed(1)}km`} from you
                          </span>
                        )}
                        <span className="text-xs text-gray-400 ml-auto">
                          {new Date(ride.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {/* Addresses */}
                      <div className="space-y-1.5 text-sm mb-3">
                        <div className="flex items-start gap-2">
                          <span className="text-green-600 mt-0.5 flex-shrink-0">From</span>
                          <div>
                            <p className="text-xs text-gray-400">Pickup</p>
                            <p className="text-gray-700 font-medium">{ride.pickup_address || 'Unknown location'}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-red-600 mt-0.5 flex-shrink-0">To</span>
                          <div>
                            <p className="text-xs text-gray-400">Destination</p>
                            <p className="text-gray-700 font-medium">{ride.destination_address || 'Unknown location'}</p>
                          </div>
                        </div>
                      </div>

                      {/* Notes */}
                      {ride.notes && (
                        <p className="text-xs text-gray-500 bg-gray-50 rounded p-2 mb-3">
                          Notes: {ride.notes}
                        </p>
                      )}

                      {/* Community member info */}
                      {ride.requester && (
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs">
                            {ride.requester.name?.charAt(0).toUpperCase()}
                          </span>
                          <span>Requested by community member <span className="font-medium text-gray-700">{ride.requester.name}</span></span>
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex-shrink-0 flex flex-col gap-2">
                      <button
                        onClick={() => handleAccept(ride.ride_request_id)}
                        disabled={accepting === ride.ride_request_id}
                        className={`px-5 py-2.5 rounded-xl font-semibold text-sm text-white shadow-md transition-all disabled:opacity-50 ${
                          ride.urgency === 'emergency'
                            ? 'bg-red-600 hover:bg-red-700'
                            : ride.urgency === 'urgent'
                            ? 'bg-orange-500 hover:bg-orange-600'
                            : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                      >
                        {accepting === ride.ride_request_id ? '...' : 'Support This Ride'}
                      </button>
                      <button
                        disabled
                        className="px-5 py-2 rounded-xl text-sm text-gray-400 border border-gray-200 bg-gray-50 cursor-not-allowed"
                      >
                        Sorry not available
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <EmergencyRideModal
        isOpen={showEmergencyRideModal}
        onClose={() => setShowEmergencyRideModal(false)}
      />
    </div>
  );
};

export default AvailableRidesPage;

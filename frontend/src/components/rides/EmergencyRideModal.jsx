import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ridesAPI } from '../../services/api';

const NASHVILLE_VIEWBOX = '-87.10,36.40,-86.50,35.96';

const useAddressAutocomplete = () => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [coords, setCoords] = useState(null);
  const debounceRef = useRef(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (!query || query.length < 3 || coords) {
      setSuggestions([]);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&countrycodes=us&addressdetails=1&viewbox=${NASHVILLE_VIEWBOX}&bounded=1`
        );
        setSuggestions(await res.json());
      } catch { setSuggestions([]); }
    }, 350);
  }, [query, coords]);

  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setSuggestions([]);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const select = (item) => {
    setQuery(item.display_name);
    setCoords({ lat: parseFloat(item.lat), lng: parseFloat(item.lon) });
    setSuggestions([]);
  };

  const reset = () => { setQuery(''); setCoords(null); setSuggestions([]); };

  return { query, setQuery: (v) => { setQuery(v); setCoords(null); }, suggestions, coords, select, reset, wrapperRef };
};

const AddressField = ({ label, hook, placeholder }) => (
  <div ref={hook.wrapperRef} className="relative">
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <input
      type="text"
      value={hook.query}
      onChange={(e) => hook.setQuery(e.target.value)}
      placeholder={placeholder}
      className="input-field"
      required
    />
    {hook.coords && (
      <span className="absolute right-3 top-9 text-green-500 text-xs font-medium">✓ Located</span>
    )}
    {hook.suggestions.length > 0 && (
      <ul className="absolute z-[9999] w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
        {hook.suggestions.map((s) => (
          <li
            key={s.place_id}
            onMouseDown={() => hook.select(s)}
            className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm text-gray-700 border-b border-gray-100 last:border-0"
          >
            {s.display_name}
          </li>
        ))}
      </ul>
    )}
  </div>
);

const URGENCY_OPTIONS = [
  { value: 'emergency', label: 'Emergency', desc: 'Life-threatening — hospital run, critical care', color: 'border-red-500 bg-red-50 text-red-700' },
  { value: 'urgent',    label: 'Urgent',    desc: 'Needed soon — medical appointment, pharmacy', color: 'border-orange-400 bg-orange-50 text-orange-700' },
  { value: 'normal',    label: 'Normal',    desc: 'Flexible timing — errand, store run',          color: 'border-blue-400 bg-blue-50 text-blue-700' },
];

const EmergencyRideModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const pickup = useAddressAutocomplete();
  const destination = useAddressAutocomplete();
  const [urgency, setUrgency] = useState('urgent');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!pickup.coords) { setError('Please select a pickup address from the suggestions.'); return; }
    if (!destination.coords) { setError('Please select a destination from the suggestions.'); return; }

    setSubmitting(true);
    setError('');
    try {
      const response = await ridesAPI.create({
        pickup_lat:        pickup.coords.lat,
        pickup_lng:        pickup.coords.lng,
        pickup_address:    pickup.query,
        destination_lat:   destination.coords.lat,
        destination_lng:   destination.coords.lng,
        destination_address: destination.query,
        urgency,
        notes,
      });
      onClose();
      navigate(`/rides/${response.data.ride_request_id}`);
    } catch (err) {
      setError(err.message || 'Failed to create support ride request.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Request a Community Support Ride</h2>
            <p className="text-sm text-gray-500 mt-0.5">Nearby Commodores will be notified immediately</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
          )}

          {/* Urgency */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">How urgent is this?</label>
            <div className="space-y-2">
              {URGENCY_OPTIONS.map((opt) => (
                <label key={opt.value} className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${urgency === opt.value ? opt.color : 'border-gray-200 hover:border-gray-300'}`}>
                  <input type="radio" name="urgency" value={opt.value} checked={urgency === opt.value}
                    onChange={() => setUrgency(opt.value)} className="mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm">{opt.label}</p>
                    <p className="text-xs text-gray-500">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <AddressField label="Pickup Location" hook={pickup} placeholder="Where do you need to be picked up?" />
          <AddressField label="Destination" hook={destination} placeholder="Where do you need to go?" />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="e.g. I need a wheelchair-accessible vehicle, going to Vanderbilt Hospital ER"
              className="input-field"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium">
              Cancel
            </button>
            <button type="submit" disabled={submitting}
              className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold disabled:opacity-50">
              {submitting ? 'Sending...' : 'Request Support Ride'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmergencyRideModal;

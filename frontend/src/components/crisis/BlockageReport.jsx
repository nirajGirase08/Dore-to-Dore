import React, { useState } from 'react';
import { createBlockage } from '../../services/blockageService';

const BLOCKAGE_TYPES = [
  { value: 'tree_down', label: 'Tree Down' },
  { value: 'flooding', label: 'Flooding' },
  { value: 'ice', label: 'Ice' },
  { value: 'power_line', label: 'Power Line' },
  { value: 'debris', label: 'Debris' },
  { value: 'road_closure', label: 'Road Closure' },
  { value: 'other', label: 'Other' },
];

const SEVERITIES = [
  { value: 'low', label: 'Low', color: 'bg-green-100 text-green-800 border-green-300' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800 border-orange-300' },
  { value: 'critical', label: 'Critical', color: 'bg-red-100 text-red-800 border-red-300' },
];

const BlockageReport = ({ onSuccess }) => {
  const [form, setForm] = useState({
    blockage_type: '',
    severity: '',
    description: '',
    location_address: '',
    notify_authorities: true,
  });
  const [coords, setCoords] = useState({ lat: null, lng: null });
  const [geoLoading, setGeoLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }
    setGeoLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setForm((f) => ({ ...f, location_address: '' }));
        setGeoLoading(false);
      },
      () => {
        setError('Unable to retrieve your location. Please enter the address manually.');
        setGeoLoading(false);
      }
    );
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
    if (name === 'location_address') setCoords({ lat: null, lng: null });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!form.blockage_type) return setError('Please select a blockage type.');
    if (!form.severity) return setError('Please select a severity level.');
    if (!coords.lat && !form.location_address.trim()) {
      return setError('Please provide a location (use current location or enter an address).');
    }

    setSubmitting(true);
    try {
      const payload = {
        blockage_type: form.blockage_type,
        severity: form.severity,
        description: form.description,
        notify_authorities: form.notify_authorities,
      };
      if (coords.lat) {
        payload.location_lat = coords.lat;
        payload.location_lng = coords.lng;
      } else {
        payload.location_address = form.location_address;
      }

      const data = await createBlockage(payload);
      setSuccess(data);
      if (onSuccess) onSuccess(data.blockage);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="card text-center">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Blockage Reported!</h2>
        <p className="text-gray-600 mb-2">
          Your report has been submitted successfully.
        </p>
        {success.authority_notified && (
          <p className="text-green-700 font-semibold mb-4">✓ Authorities have been notified.</p>
        )}
        <button
          className="btn-primary"
          onClick={() => {
            setSuccess(null);
            setForm({
              blockage_type: '',
              severity: '',
              description: '',
              location_address: '',
              notify_authorities: true,
            });
            setCoords({ lat: null, lng: null });
          }}
        >
          Report Another
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-5">
      <h2 className="text-2xl font-bold text-gray-800">Report a Blockage</h2>

      {error && (
        <div className="bg-red-50 border border-red-300 text-red-700 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* Location */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
        <button
          type="button"
          onClick={handleUseCurrentLocation}
          disabled={geoLoading}
          className="btn-secondary text-sm py-2 px-4 mb-3"
        >
          {geoLoading ? 'Getting location…' : '📍 Use Current Location'}
        </button>
        {coords.lat && (
          <p className="text-sm text-green-700 mb-2">
            ✓ Location captured ({coords.lat.toFixed(5)}, {coords.lng.toFixed(5)})
          </p>
        )}
        <input
          type="text"
          name="location_address"
          value={form.location_address}
          onChange={handleChange}
          placeholder="Or enter address (e.g. 21st Ave S & Broadway)"
          className="input-field"
          disabled={!!coords.lat}
        />
        {coords.lat && (
          <button
            type="button"
            onClick={() => setCoords({ lat: null, lng: null })}
            className="text-xs text-gray-500 mt-1 underline"
          >
            Clear and enter address instead
          </button>
        )}
      </div>

      {/* Blockage Type */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Blockage Type</label>
        <select
          name="blockage_type"
          value={form.blockage_type}
          onChange={handleChange}
          className="input-field"
        >
          <option value="">Select type…</option>
          {BLOCKAGE_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      {/* Severity */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Severity</label>
        <div className="flex flex-wrap gap-2">
          {SEVERITIES.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => setForm((f) => ({ ...f, severity: s.value }))}
              className={`px-4 py-2 rounded-lg border-2 font-semibold text-sm transition-all ${s.color} ${
                form.severity === s.value ? 'border-opacity-100 ring-2 ring-offset-1 ring-gray-400' : 'border-opacity-40 opacity-70'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Description <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          rows={3}
          placeholder="Describe the blockage (e.g. large oak tree blocking both lanes…)"
          className="input-field resize-none"
        />
      </div>

      {/* Notify Authorities */}
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          name="notify_authorities"
          checked={form.notify_authorities}
          onChange={handleChange}
          className="w-5 h-5 rounded accent-primary-600"
        />
        <span className="text-sm font-medium text-gray-700">
          Notify Authorities (recommended for high/critical severity)
        </span>
      </label>

      {/* Submit */}
      <button
        type="submit"
        disabled={submitting}
        className="btn-primary w-full text-lg py-4"
      >
        {submitting ? 'Submitting…' : 'Submit Blockage Report'}
      </button>
    </form>
  );
};

export default BlockageReport;

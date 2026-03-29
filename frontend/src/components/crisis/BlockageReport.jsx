import React, { useState, useEffect, useRef } from 'react';
import { createBlockage, uploadBlockageImage } from '../../services/blockageService';
import { useAuth } from '../../contexts/AuthContext';

const BLOCKAGE_TYPES = [
  { value: 'accident', label: 'Accident' },
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
  const { user } = useAuth();
  const [form, setForm] = useState({
    blockage_type: '',
    severity: '',
    description: '',
    location_address: '',
    notify_authorities: true,
  });
  const [coords, setCoords]         = useState({ lat: null, lng: null });
  const [geoLoading, setGeoLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState(null);
  const [success, setSuccess]       = useState(null);
  const [imageFile, setImageFile]   = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  // Address autocomplete
  const [suggestions, setSuggestions]     = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const debounceTimer = useRef(null);
  const wrapperRef    = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleUseHomeAddress = () => {
    if (!user?.location_lat || !user?.location_lng) {
      setError('No home address saved in your profile. Please enter the address manually.');
      return;
    }
    setError(null);
    setSuggestions([]);
    setShowSuggestions(false);
    setCoords({ lat: parseFloat(user.location_lat), lng: parseFloat(user.location_lng) });
    setForm((f) => ({ ...f, location_address: user.location_address || '' }));
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }
    setGeoLoading(true);
    setError(null);
    setSuggestions([]);
    setShowSuggestions(false);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCoords({ lat, lng });
        try {
          const res  = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
          const data = await res.json();
          setForm((f) => ({ ...f, location_address: data.display_name || '' }));
        } catch {
          setForm((f) => ({ ...f, location_address: '' }));
        }
        setGeoLoading(false);
      },
      (err) => {
        setError(
          err.code === err.PERMISSION_DENIED
            ? 'Location access denied. Please allow location access or enter the address manually.'
            : 'Unable to retrieve your location. Please enter the address manually.'
        );
        setGeoLoading(false);
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
    );
  };

  const handleAddressChange = (e) => {
    const value = e.target.value;
    setForm((f) => ({ ...f, location_address: value }));
    setCoords({ lat: null, lng: null });

    clearTimeout(debounceTimer.current);

    if (value.trim().length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    debounceTimer.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        // viewbox biases results toward Nashville metro; bounded=0 still allows
        // results outside the box if nothing local matches
        const NASHVILLE_VIEWBOX = '-87.10,36.40,-86.50,35.96'; // left,top,right,bottom
        const res  = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(value)}&format=json&limit=5&countrycodes=us&addressdetails=1&viewbox=${NASHVILLE_VIEWBOX}&bounded=1`
        );
        const data = await res.json();
        setSuggestions(data);
        setShowSuggestions(data.length > 0);
      } catch {
        setSuggestions([]);
      } finally {
        setSearchLoading(false);
      }
    }, 350);
  };

  const handleSelectSuggestion = (item) => {
    setForm((f) => ({ ...f, location_address: item.display_name }));
    setCoords({ lat: parseFloat(item.lat), lng: parseFloat(item.lon) });
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Only JPG, PNG, and WEBP images are allowed.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be 5 MB or smaller.');
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setError(null);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
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
      let photo_url = null;
      if (imageFile) {
        const uploadResult = await uploadBlockageImage(imageFile);
        photo_url = uploadResult.data?.image_url || null;
      }

      const payload = {
        blockage_type:      form.blockage_type,
        severity:           form.severity,
        description:        form.description,
        notify_authorities: form.notify_authorities,
        photo_url,
      };
      if (coords.lat) {
        payload.location_lat     = coords.lat;
        payload.location_lng     = coords.lng;
        payload.location_address = form.location_address;
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
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Blockage Reported!</h2>
        <p className="text-gray-600 mb-2">Your report has been submitted successfully.</p>
        {success.authority_notified && (
          <p className="text-green-700 font-semibold mb-4">Authorities have been notified.</p>
        )}
        <button
          className="btn-primary"
          onClick={() => {
            setSuccess(null);
            setForm({ blockage_type: '', severity: '', description: '', location_address: '', notify_authorities: true });
            setCoords({ lat: null, lng: null });
            setImageFile(null);
            setImagePreview(null);
          }}
        >
          Report Another
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-5">
      <h2 className="text-2xl font-bold text-gray-800">Report a Road Hazard</h2>

      {error && (
        <div className="bg-red-50 border border-red-300 text-red-700 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* Location */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
        <div className="flex flex-wrap gap-2 mb-3">
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={geoLoading}
            className="btn-secondary text-sm py-2 px-4"
          >
            {geoLoading ? 'Getting location…' : 'Use Current Location'}
          </button>
          <button
            type="button"
            onClick={handleUseHomeAddress}
            disabled={!user?.location_lat}
            className="btn-secondary text-sm py-2 px-4 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Home Address
          </button>
        </div>

        {coords.lat && (
          <p className="text-xs text-green-700 mb-2">
            ✓ GPS coordinates captured ({coords.lat.toFixed(5)}, {coords.lng.toFixed(5)})
          </p>
        )}

        {/* Address input with autocomplete */}
        <div className="relative" ref={wrapperRef}>
          <input
            type="text"
            name="location_address"
            value={form.location_address}
            onChange={handleAddressChange}
            placeholder="Search address (e.g. 21st Ave S & Broadway)"
            className="input-field"
            autoComplete="off"
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          />

          {searchLoading && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
              Searching…
            </span>
          )}

          {showSuggestions && suggestions.length > 0 && (
            <ul className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
              {suggestions.map((item) => (
                <li
                  key={item.place_id}
                  onMouseDown={() => handleSelectSuggestion(item)}
                  className="px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-0"
                >
                  <span className="font-medium text-gray-900">
                    {item.address?.road || item.address?.amenity || item.name || ''}
                    {(item.address?.road || item.address?.amenity || item.name) ? ', ' : ''}
                  </span>
                  <span className="text-gray-500">
                    {[item.address?.city || item.address?.town || item.address?.village, item.address?.state]
                      .filter(Boolean)
                      .join(', ')}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {coords.lat && (
          <button
            type="button"
            onClick={() => { setCoords({ lat: null, lng: null }); setForm((f) => ({ ...f, location_address: '' })); }}
            className="text-xs text-gray-500 mt-1 underline"
          >
            Clear and search again
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

      {/* Photo Upload */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Photo <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        {imagePreview ? (
          <div className="relative inline-block">
            <img
              src={imagePreview}
              alt="Preview"
              className="rounded-lg max-h-48 max-w-full object-cover border border-gray-200"
            />
            <button
              type="button"
              onClick={handleRemoveImage}
              className="absolute top-1 right-1 bg-white border border-gray-300 rounded-full w-6 h-6 flex items-center justify-center text-gray-600 hover:bg-red-50 hover:text-red-600 text-xs font-bold shadow"
              title="Remove photo"
            >
              ✕
            </button>
          </div>
        ) : (
          <label className="flex items-center gap-3 cursor-pointer border-2 border-dashed border-gray-300 rounded-lg px-4 py-3 hover:border-primary-400 transition-colors">
            <span className="text-base font-semibold">Photo</span>
            <div>
              <p className="text-sm font-medium text-gray-700">Upload a photo</p>
              <p className="text-xs text-gray-400">JPG, PNG, or WEBP · max 5 MB</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageChange}
              className="sr-only"
            />
          </label>
        )}
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

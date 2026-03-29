import React, { useEffect, useRef, useState } from 'react';

const NASHVILLE_VIEWBOX = '-87.10,36.40,-86.50,35.96';

/**
 * Reusable address field with:
 *  - "Use Current Location" button (geolocation → reverse geocode)
 *  - Nominatim autocomplete suggestions (Nashville-biased)
 *
 * Props:
 *   address       {string}   current text value
 *   coords        {{ lat, lng } | null}
 *   onChange      (address, lat, lng) => void
 *   label         {string}   field label
 *   required      {bool}
 *   placeholder   {string}
 */
const AddressAutocomplete = ({
  address = '',
  coords = null,
  onChange,
  label = 'Location/Address',
  required = false,
  placeholder = 'Search address…',
}) => {
  const [suggestions, setSuggestions]         = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchLoading, setSearchLoading]     = useState(false);
  const [geoLoading, setGeoLoading]           = useState(false);
  const [geoError, setGeoError]               = useState(null);

  const debounceTimer = useRef(null);
  const wrapperRef    = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }
    setGeoLoading(true);
    setGeoError(null);
    setSuggestions([]);
    setShowSuggestions(false);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        try {
          const res  = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
          );
          const data = await res.json();
          onChange(data.display_name || '', lat, lng);
        } catch {
          onChange('', lat, lng);
        }
        setGeoLoading(false);
      },
      (err) => {
        setGeoError(
          err.code === err.PERMISSION_DENIED
            ? 'Location access denied. Please allow location access or enter the address manually.'
            : 'Unable to retrieve your location. Please enter the address manually.'
        );
        setGeoLoading(false);
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
    );
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    onChange(value, null, null);
    setGeoError(null);

    clearTimeout(debounceTimer.current);

    if (value.trim().length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    debounceTimer.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
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
    onChange(item.display_name, parseFloat(item.lat), parseFloat(item.lon));
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const hasCoords = coords?.lat != null && !isNaN(parseFloat(coords.lat));

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required ? ' *' : ' (optional)'}
      </label>

      <button
        type="button"
        onClick={handleUseCurrentLocation}
        disabled={geoLoading}
        className="btn-secondary text-sm py-1.5 px-3 mb-2"
      >
        {geoLoading ? 'Getting location…' : 'Use Current Location'}
      </button>

      {hasCoords && (
        <p className="text-xs text-green-700 mb-1">
          ✓ GPS coordinates captured ({parseFloat(coords.lat).toFixed(5)}, {parseFloat(coords.lng).toFixed(5)})
        </p>
      )}

      {geoError && (
        <p className="text-xs text-red-600 mb-1">{geoError}</p>
      )}

      <div className="relative" ref={wrapperRef}>
        <input
          type="text"
          value={address}
          onChange={handleInputChange}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          required={required}
          placeholder={placeholder}
          autoComplete="off"
          className="input-field"
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
                  {[
                    item.address?.city || item.address?.town || item.address?.village,
                    item.address?.state,
                  ]
                    .filter(Boolean)
                    .join(', ')}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {hasCoords && (
        <button
          type="button"
          onClick={() => onChange('', null, null)}
          className="text-xs text-gray-500 mt-1 underline"
        >
          Clear and search again
        </button>
      )}
    </div>
  );
};

export default AddressAutocomplete;

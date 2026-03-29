import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authAPI, trustAPI, uploadsAPI } from '../services/api';
import PendingFeedbackSection from '../components/shared/PendingFeedbackSection';
import TrustSummary from '../components/shared/TrustSummary';

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    location_address: '',
  });
  const [coords, setCoords] = useState({ lat: null, lng: null });
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const debounceTimer = useRef(null);
  const addressWrapperRef = useRef(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');
  const [trustSummary, setTrustSummary] = useState(null);
  const [pendingFeedback, setPendingFeedback] = useState([]);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (!user) return;
    setFormData({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      location_address: user.location_address || '',
    });
    setCoords({
      lat: user.location_lat ? parseFloat(user.location_lat) : null,
      lng: user.location_lng ? parseFloat(user.location_lng) : null,
    });
    setImagePreviewUrl(user.profile_image_url || '');
    setSelectedImageFile(null);
  }, [user]);

  // Close address dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (addressWrapperRef.current && !addressWrapperRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const loadTrust = async () => {
      try {
        const response = await trustAPI.getMySummary();
        setTrustSummary(response.data?.summary || null);
        setPendingFeedback(response.data?.pending_feedback || []);
      } catch (err) {
        console.error('Failed to load trust summary:', err);
      }
    };

    loadTrust();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
    setError('');
    setSuccessMessage('');
  };

  const handleImageSelection = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setSelectedImageFile(file);
    setImagePreviewUrl(URL.createObjectURL(file));
    setError('');
    setSuccessMessage('');
  };

  const handleImageUpload = async () => {
    if (!selectedImageFile) {
      setError('Please choose an image first.');
      return;
    }

    setUploadingImage(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await uploadsAPI.uploadProfileImage(selectedImageFile);
      const updatedUser = response.data?.user;

      if (updatedUser) {
        updateUser(updatedUser);
        setImagePreviewUrl(updatedUser.profile_image_url || '');
      }

      setSelectedImageFile(null);
      setSuccessMessage('Profile photo updated.');
    } catch (err) {
      setError(err.message || 'Failed to upload profile photo.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAddressChange = (e) => {
    const value = e.target.value;
    setFormData((f) => ({ ...f, location_address: value }));
    setCoords({ lat: null, lng: null });
    clearTimeout(debounceTimer.current);
    if (value.trim().length < 3) { setSuggestions([]); setShowSuggestions(false); return; }
    debounceTimer.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const NASHVILLE_VIEWBOX = '-87.10,36.40,-86.50,35.96';
        const res = await fetch(
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
    setFormData((f) => ({ ...f, location_address: item.display_name }));
    setCoords({ lat: parseFloat(item.lat), lng: parseFloat(item.lon) });
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await authAPI.updateProfile({ ...formData, location_lat: coords.lat, location_lng: coords.lng });
      const updatedUser = response.data?.user;

      if (updatedUser) {
        updateUser(updatedUser);
      }

      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container-custom py-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Your Profile</h1>
          <p className="mt-2 text-gray-600">
            Update your personal details used across Dore-to-Dore.
          </p>
        </div>

        {pendingFeedback.length > 0 && (
          <div className="mb-6">
            <PendingFeedbackSection
              pendingFeedback={pendingFeedback}
              onFeedbackSubmitted={async () => {
                const response = await trustAPI.getMySummary();
                setTrustSummary(response.data?.summary || null);
                setPendingFeedback(response.data?.pending_feedback || []);
              }}
            />
          </div>
        )}

        <div className="mb-6">
          <TrustSummary summary={trustSummary} title="Your Trust Profile" />
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex flex-col gap-4 rounded-xl border border-gray-100 bg-gray-50 p-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              {imagePreviewUrl ? (
                <img
                  src={imagePreviewUrl}
                  alt={`${user?.name || 'User'} profile`}
                  className="h-20 w-20 rounded-full object-cover ring-4 ring-white"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary-100 text-2xl font-bold text-primary-700 ring-4 ring-white">
                  {(user?.name || 'U').charAt(0).toUpperCase()}
                </div>
              )}

              <div>
                <p className="text-sm font-semibold text-gray-900">Profile Photo</p>
                <p className="text-sm text-gray-500">
                  JPG, PNG, or WEBP up to 5 MB.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleImageSelection}
                className="block w-full text-sm text-gray-600 file:mr-4 file:rounded-lg file:border-0 file:bg-primary-600 file:px-4 file:py-2 file:font-semibold file:text-white hover:file:bg-primary-700"
              />
              <button
                type="button"
                onClick={handleImageUpload}
                disabled={!selectedImageFile || uploadingImage}
                className="btn-primary min-w-40"
              >
                {uploadingImage ? 'Uploading...' : 'Upload Photo'}
              </button>
            </div>
          </div>

          <div className="mb-6 grid gap-4 rounded-xl bg-primary-50 p-5 md:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-primary-700">
                Account Type
              </p>
              <p className="mt-1 text-base font-semibold text-gray-900">
                {user?.user_type || 'student'}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-primary-700">
                Gender
              </p>
              <p className="mt-1 text-base font-semibold capitalize text-gray-900">
                {(user?.gender || 'prefer_not_to_answer').replaceAll('_', ' ')}
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {successMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-700">
                Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                className="input-field"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="input-field"
                required
              />
            </div>

            <div>
              <label htmlFor="phone" className="mb-1 block text-sm font-medium text-gray-700">
                Contact Number
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                className="input-field"
                placeholder="(615) 555-1234"
              />
            </div>

            <div>
              <label htmlFor="location_address" className="mb-1 block text-sm font-medium text-gray-700">
                Address
              </label>
              <div className="relative" ref={addressWrapperRef}>
                <input
                  id="location_address"
                  name="location_address"
                  type="text"
                  value={formData.location_address}
                  onChange={handleAddressChange}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  className="input-field"
                  placeholder="Vanderbilt Dorm, Nashville, TN"
                  autoComplete="off"
                />
                {searchLoading && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">Searching…</span>
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
                            .filter(Boolean).join(', ')}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {coords.lat && (
                <p className="text-xs text-green-700 mt-1">✓ Coordinates captured ({coords.lat.toFixed(4)}, {coords.lng.toFixed(4)})</p>
              )}
              {!coords.lat && formData.location_address && (
                <p className="text-xs text-amber-600 mt-1">⚠ Select a suggestion to save GPS coordinates</p>
            )}
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="btn-primary min-w-40"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;

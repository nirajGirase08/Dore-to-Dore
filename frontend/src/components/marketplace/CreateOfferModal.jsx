import React, { useEffect, useState } from 'react';
import { offersAPI, uploadsAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { RESOURCE_TYPES, TARGET_GENDER_OPTIONS } from '../../constants/marketplace';
import AddressAutocomplete from '../shared/AddressAutocomplete';

const createEmptyItem = () => ({
  resource_type: 'food',
  quantity: 1,
  notes: '',
  imageFile: null,
  imagePreviewUrl: '',
});

const CreateOfferModal = ({ isOpen, onClose, onSuccess, initialData = null, mode = 'create' }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const defaultFormData = {
    title: '',
    description: '',
    location_address: '',
    location_lat: null,
    location_lng: null,
    target_gender: '',
    delivery_available: false,
    available_until: '',
  };

  const [formData, setFormData] = useState(defaultFormData);
  const [items, setItems] = useState([createEmptyItem()]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (initialData) {
      setFormData({
        title: initialData.title || '',
        description: initialData.description || '',
        location_address: initialData.location_address || '',
        location_lat: initialData.location_lat || null,
        location_lng: initialData.location_lng || null,
        target_gender: initialData.target_gender || '',
        delivery_available: !!initialData.delivery_available,
        available_until: initialData.available_until ? initialData.available_until.slice(0, 16) : '',
      });
      setItems(
        (initialData.items || []).map((item) => ({
          resource_type: item.resource_type,
          quantity: item.quantity_total || item.quantity || 1,
          notes: item.notes || '',
          imageFile: null,
          imagePreviewUrl: item.image_url || '',
          existingImageUrl: item.image_url || '',
        }))
      );
    } else {
      setFormData(defaultFormData);
      setItems([createEmptyItem()]);
    }

    setError('');
  }, [isOpen, initialData, user]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, createEmptyItem()]);
  };

  const removeItem = (index) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const uploadedItems = await Promise.all(
        items.map(async (item) => {
          let imageUrl = null;

          if (item.imageFile) {
            const uploadResponse = await uploadsAPI.uploadOfferItemImage(item.imageFile);
            imageUrl = uploadResponse.data?.image_url || null;
          } else if (item.existingImageUrl) {
            imageUrl = item.existingImageUrl;
          }

          return {
            resource_type: item.resource_type,
            quantity: parseInt(item.quantity, 10) || 1,
            notes: item.notes,
            image_url: imageUrl,
          };
        })
      );

      // Prepare data with proper null handling for optional fields
      const offerData = {
        ...formData,
        // Convert empty string to null for available_until
        available_until: formData.available_until || null,
        target_gender: formData.target_gender || null,
        items: uploadedItems,
      };

      if (mode === 'edit' && initialData?.offer_id) {
        await offersAPI.update(initialData.offer_id, offerData);
      } else {
        await offersAPI.create(offerData);
      }

      onSuccess();
      onClose();

      // Reset form
      setFormData(defaultFormData);
      setItems([createEmptyItem()]);
    } catch (err) {
      // Extract error message from different possible error formats
      const errorMessage = err?.response?.data?.error || err?.message || 'Failed to create offer';
      setError(errorMessage);
      console.error('Create offer error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleItemImageChange = (index, file) => {
    if (!file) {
      return;
    }

    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      imageFile: file,
      imagePreviewUrl: URL.createObjectURL(file),
      existingImageUrl: null,
    };
    setItems(newItems);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              {mode === 'edit' ? 'Edit Offer' : 'Create New Offer'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="input-field"
                placeholder="e.g., Hot Meals & Blankets Available"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="3"
                className="input-field"
                placeholder="Describe what you're offering..."
              />
            </div>

            <AddressAutocomplete
              address={formData.location_address}
              coords={formData.location_lat ? { lat: formData.location_lat, lng: formData.location_lng } : null}
              onChange={(address, lat, lng) =>
                setFormData((f) => ({ ...f, location_address: address, location_lat: lat, location_lng: lng }))
              }
              label="Location/Address"
              required
              placeholder="Your location"
            />

            <div className="flex items-center">
              <input
                type="checkbox"
                name="delivery_available"
                checked={formData.delivery_available}
                onChange={handleChange}
                className="mr-2"
              />
              <label className="text-sm text-gray-700">
                I can deliver these items
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Audience (optional)
              </label>
              <select
                name="target_gender"
                value={formData.target_gender}
                onChange={handleChange}
                className="input-field"
              >
                {TARGET_GENDER_OPTIONS.map((option) => (
                  <option key={option.value || 'everyone'} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Available Until (optional)
              </label>
              <input
                type="datetime-local"
                name="available_until"
                value={formData.available_until}
                onChange={handleChange}
                className="input-field"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Items to Offer *
                </label>
                <button
                  type="button"
                  onClick={addItem}
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  + Add Item
                </button>
              </div>

              {items.map((item, index) => (
                <div key={index} className="mb-3 rounded-xl border border-gray-200 p-3">
                  <div className="flex gap-2">
                    <select
                      value={item.resource_type}
                      onChange={(e) => handleItemChange(index, 'resource_type', e.target.value)}
                      className="input-field flex-1"
                    >
                      {RESOURCE_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      min="1"
                      className="input-field w-24"
                      placeholder="Qty"
                    />
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="px-3 text-red-600 hover:text-red-700"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <input
                    type="text"
                    value={item.notes}
                    onChange={(e) => handleItemChange(index, 'notes', e.target.value)}
                    className="input-field mt-2"
                    placeholder="Notes (optional)"
                  />

                  <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={(e) => handleItemImageChange(index, e.target.files?.[0])}
                      className="block w-full text-sm text-gray-600 file:mr-4 file:rounded-lg file:border-0 file:bg-primary-600 file:px-4 file:py-2 file:font-semibold file:text-white hover:file:bg-primary-700"
                    />
                    {item.imagePreviewUrl && (
                      <img
                        src={item.imagePreviewUrl}
                        alt={`${item.resource_type} preview`}
                        className="h-16 w-16 rounded-lg object-cover"
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex-1"
              >
                {loading ? (mode === 'edit' ? 'Saving...' : 'Creating...') : (mode === 'edit' ? 'Save Offer' : 'Create Offer')}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateOfferModal;

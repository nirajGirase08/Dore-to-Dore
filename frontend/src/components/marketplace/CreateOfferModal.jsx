import React, { useState } from 'react';
import { offersAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const RESOURCE_TYPES = [
  { value: 'food', label: 'Food' },
  { value: 'water', label: 'Water' },
  { value: 'shelter', label: 'Shelter' },
  { value: 'blankets', label: 'Blankets' },
  { value: 'clothes', label: 'Clothes' },
  { value: 'medical', label: 'Medical Supplies' },
  { value: 'transport', label: 'Transportation' },
  { value: 'power', label: 'Power/Charging' },
  { value: 'other', label: 'Other' },
];

const CreateOfferModal = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location_address: user?.location_address || '',
    location_lat: user?.location_lat || 36.1447,
    location_lng: user?.location_lng || -86.8027,
    delivery_available: false,
    available_until: '',
  });

  const [items, setItems] = useState([
    { resource_type: 'food', quantity: 1, notes: '' },
  ]);

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
    setItems([...items, { resource_type: 'food', quantity: 1, notes: '' }]);
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
      // Prepare data with proper null handling for optional fields
      const offerData = {
        ...formData,
        // Convert empty string to null for available_until
        available_until: formData.available_until || null,
        items: items.map(item => ({
          ...item,
          quantity: parseInt(item.quantity) || 1,
        })),
      };

      await offersAPI.create(offerData);

      onSuccess();
      onClose();

      // Reset form
      setFormData({
        title: '',
        description: '',
        location_address: user?.location_address || '',
        location_lat: user?.location_lat || 36.1447,
        location_lng: user?.location_lng || -86.8027,
        delivery_available: false,
        available_until: '',
      });
      setItems([{ resource_type: 'food', quantity: 1, notes: '' }]);
    } catch (err) {
      // Extract error message from different possible error formats
      const errorMessage = err?.response?.data?.error || err?.message || 'Failed to create offer';
      setError(errorMessage);
      console.error('Create offer error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Create New Offer</h2>
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location/Address *
              </label>
              <input
                type="text"
                name="location_address"
                value={formData.location_address}
                onChange={handleChange}
                required
                className="input-field"
                placeholder="Your location"
              />
            </div>

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
                <div key={index} className="flex gap-2 mb-2">
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
                  <input
                    type="text"
                    value={item.notes}
                    onChange={(e) => handleItemChange(index, 'notes', e.target.value)}
                    className="input-field flex-1"
                    placeholder="Notes (optional)"
                  />
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex-1"
              >
                {loading ? 'Creating...' : 'Create Offer'}
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

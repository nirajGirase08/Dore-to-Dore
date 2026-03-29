import React, { useEffect, useState } from 'react';
import { requestsAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { RESOURCE_TYPES, TARGET_GENDER_OPTIONS } from '../../constants/marketplace';

const URGENCY_LEVELS = [
  { value: 'low', label: 'Low', color: 'text-gray-700' },
  { value: 'medium', label: 'Medium', color: 'text-yellow-700' },
  { value: 'high', label: 'High', color: 'text-orange-700' },
  { value: 'critical', label: 'Critical', color: 'text-red-700' },
];

const createEmptyItem = () => ({ resource_type: 'food', quantity: 1, notes: '' });

const CreateRequestModal = ({ isOpen, onClose, onSuccess, initialData = null, mode = 'create' }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const defaultFormData = {
    title: '',
    description: '',
    urgency_level: 'medium',
    location_address: user?.location_address || '',
    location_lat: user?.location_lat || 36.1447,
    location_lng: user?.location_lng || -86.8027,
    target_gender: '',
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
        urgency_level: initialData.urgency_level || 'medium',
        location_address: initialData.location_address || user?.location_address || '',
        location_lat: initialData.location_lat || user?.location_lat || 36.1447,
        location_lng: initialData.location_lng || user?.location_lng || -86.8027,
        target_gender: initialData.target_gender || '',
      });
      setItems(
        (initialData.items || []).map((item) => ({
          resource_type: item.resource_type,
          quantity: item.quantity_needed || item.quantity || 1,
          notes: item.notes || '',
        }))
      );
    } else {
      setFormData(defaultFormData);
      setItems([createEmptyItem()]);
    }

    setError('');
  }, [isOpen, initialData, user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
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
      const requestData = {
        ...formData,
        target_gender: formData.target_gender || null,
        items: items.map(item => ({
          ...item,
          quantity: parseInt(item.quantity) || 1,
        })),
      };

      if (mode === 'edit' && initialData?.request_id) {
        await requestsAPI.update(initialData.request_id, requestData);
      } else {
        await requestsAPI.create(requestData);
      }

      onSuccess();
      onClose();

      // Reset form
      setFormData(defaultFormData);
      setItems([createEmptyItem()]);
    } catch (err) {
      // Extract error message from different possible error formats
      const errorMessage = err?.response?.data?.error || err?.message || 'Failed to create request';
      setError(errorMessage);
      console.error('Create request error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              {mode === 'edit' ? 'Edit Request' : 'Create New Request'}
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
                placeholder="e.g., Need Food and Water"
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
                placeholder="Describe what you need and your situation..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Urgency Level *
              </label>
              <select
                name="urgency_level"
                value={formData.urgency_level}
                onChange={handleChange}
                required
                className="input-field"
              >
                {URGENCY_LEVELS.map((level) => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {formData.urgency_level === 'critical' && '🚨 Critical: Immediate assistance needed'}
                {formData.urgency_level === 'high' && '⚠️ High: Urgent, needed soon'}
                {formData.urgency_level === 'medium' && '📋 Medium: Needed within a day or two'}
                {formData.urgency_level === 'low' && '📅 Low: Not urgent'}
              </p>
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

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Items Needed *
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
                {loading ? (mode === 'edit' ? 'Saving...' : 'Creating...') : (mode === 'edit' ? 'Save Request' : 'Create Request')}
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

export default CreateRequestModal;

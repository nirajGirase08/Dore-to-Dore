import React, { useEffect, useState } from 'react';
import { conversationsAPI } from '../../services/api';

const FulfillmentModal = ({ isOpen, mode, entity, item, onClose, onConfirm }) => {
  const [options, setOptions] = useState([]);
  const [selectedConversationId, setSelectedConversationId] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen || !entity) {
      return;
    }

    const loadOptions = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await conversationsAPI.getRelatedOptions({
          requestId: mode === 'request' ? entity.request_id : null,
          offerId: mode === 'offer' ? entity.offer_id : null,
        });
        const nextOptions = response.data || [];
        setOptions(nextOptions);
        setSelectedConversationId(nextOptions[0]?.conversation_id ? String(nextOptions[0].conversation_id) : '');
      } catch (err) {
        console.error('Failed to load fulfillment options:', err);
        setError(err.message || 'Failed to load related conversations.');
      } finally {
        setLoading(false);
      }
    };

    loadOptions();
  }, [isOpen, entity, mode]);

  if (!isOpen || !entity || !item) {
    return null;
  }

  const handleConfirm = async () => {
    if (!selectedConversationId) {
      setError('Choose the person this completion belongs to.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await onConfirm({ conversation_id: Number(selectedConversationId) });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save completion.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Record Completion</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <p className="mb-4 text-sm text-gray-600">
          Attribute <span className="font-semibold">{item.resource_type.replaceAll('_', ' ')}</span> in{' '}
          <span className="font-semibold">{entity.title}</span> to the correct conversation so the app can track who helped whom.
        </p>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <p className="py-8 text-center text-sm text-gray-500">Loading conversations...</p>
        ) : options.length === 0 ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            No related conversations found yet. Start a conversation first, then mark the item fulfilled.
          </div>
        ) : (
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Completed with
            </label>
            <select
              value={selectedConversationId}
              onChange={(event) => setSelectedConversationId(event.target.value)}
              className="input-field"
            >
              {options.map((option) => (
                <option key={option.conversation_id} value={option.conversation_id}>
                  {option.other_user?.name || 'Unknown user'}{option.other_user?.email ? ` (${option.other_user.email})` : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading || submitting || options.length === 0}
            className="btn-primary flex-1"
          >
            {submitting ? 'Saving...' : 'Confirm Completion'}
          </button>
          <button type="button" onClick={onClose} className="btn-secondary flex-1">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default FulfillmentModal;

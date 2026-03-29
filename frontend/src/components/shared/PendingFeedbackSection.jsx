import React, { useState } from 'react';
import { trustAPI } from '../../services/api';

const PendingFeedbackSection = ({ pendingFeedback = [], onFeedbackSubmitted }) => {
  const [notes, setNotes] = useState({});
  const [submittingId, setSubmittingId] = useState(null);
  const [error, setError] = useState('');

  if (!pendingFeedback.length) {
    return null;
  }

  const submitFeedback = async (transactionId, wasHelpful) => {
    try {
      setSubmittingId(transactionId);
      setError('');
      await trustAPI.submitFeedback(transactionId, {
        was_helpful: wasHelpful,
        note: notes[transactionId] || '',
      });
      onFeedbackSubmitted?.();
    } catch (err) {
      setError(err.message || 'Failed to submit feedback.');
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-5 shadow-sm">
      <h2 className="text-xl font-semibold text-cyan-950">Was This Helpful?</h2>
      <p className="mt-1 text-sm text-cyan-900">
        Confirm whether completed help was useful so the app can build trust stats and badges.
      </p>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-4 space-y-4">
        {pendingFeedback.map((entry) => (
          <div key={entry.transaction_id} className="rounded-xl border border-cyan-200 bg-white p-4">
            <div className="flex items-center gap-3">
              {entry.helper?.profile_image_url ? (
                <img
                  src={entry.helper.profile_image_url}
                  alt={`${entry.helper?.name || 'Helper'} profile`}
                  className="h-12 w-12 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-100 font-bold text-cyan-800">
                  {(entry.helper?.name || 'H').charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <p className="font-semibold text-gray-900">{entry.helper?.name || 'Helper'}</p>
                <p className="text-sm text-gray-600">
                  {entry.resource_type.replaceAll('_', ' ')} for {entry.context_title}
                </p>
              </div>
            </div>

            <textarea
              value={notes[entry.transaction_id] || ''}
              onChange={(event) => setNotes((current) => ({
                ...current,
                [entry.transaction_id]: event.target.value,
              }))}
              placeholder="Optional note"
              rows="2"
              className="input-field mt-3"
            />

            <div className="mt-3 flex gap-3">
              <button
                onClick={() => submitFeedback(entry.transaction_id, true)}
                disabled={submittingId === entry.transaction_id}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60"
              >
                {submittingId === entry.transaction_id ? 'Saving...' : 'Yes'}
              </button>
              <button
                onClick={() => submitFeedback(entry.transaction_id, false)}
                disabled={submittingId === entry.transaction_id}
                className="rounded-lg bg-gray-700 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-60"
              >
                {submittingId === entry.transaction_id ? 'Saving...' : 'No'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PendingFeedbackSection;

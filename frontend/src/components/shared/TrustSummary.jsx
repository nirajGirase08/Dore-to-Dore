import React from 'react';

const TrustSummary = ({ summary, title = 'Trust Summary' }) => {
  if (!summary) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl bg-green-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-green-700">Helped Count</p>
          <p className="mt-1 text-2xl font-bold text-green-900">{summary.helped_count}</p>
        </div>
        <div className="rounded-xl bg-blue-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Received Help</p>
          <p className="mt-1 text-2xl font-bold text-blue-900">{summary.received_help_count}</p>
        </div>
        <div className="rounded-xl bg-amber-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Helpful Feedback</p>
          <p className="mt-1 text-2xl font-bold text-amber-900">
            {summary.feedback_count > 0 ? `${summary.helpful_feedback_count}/${summary.feedback_count}` : 'No ratings yet'}
          </p>
        </div>
        <div className="rounded-xl bg-purple-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-purple-700">Helpful Rate</p>
          <p className="mt-1 text-2xl font-bold text-purple-900">
            {summary.helpful_feedback_rate !== null
              ? `${Math.round(summary.helpful_feedback_rate * 100)}%`
              : 'N/A'}
          </p>
        </div>
      </div>

      <div className="mt-5">
        <p className="text-sm font-semibold text-gray-900">Badges</p>
        {summary.badges?.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {summary.badges.map((badge) => (
              <span
                key={badge.key}
                className="rounded-full bg-gray-900 px-3 py-1 text-xs font-semibold text-white"
              >
                {badge.label}
              </span>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm text-gray-500">No badges yet.</p>
        )}
      </div>
    </div>
  );
};

export default TrustSummary;

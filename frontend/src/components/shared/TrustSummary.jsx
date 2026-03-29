import React from 'react';

const TrustSummary = ({ summary, title = 'Trust Summary', variant = 'default' }) => {
  if (!summary) {
    return null;
  }

  const isDashboard = variant === 'dashboard';
  const wrapperClass = isDashboard
    ? 'rounded-2xl border border-[#E0D5C0] bg-[#F5F3EF] p-5 shadow-sm'
    : 'rounded-2xl border border-gray-200 bg-white p-5 shadow-sm';
  const metricClasses = isDashboard
    ? [
        'rounded-xl bg-[#E4E4E4] p-4',
        'rounded-xl bg-[#F5F3EF] border border-[#E0D5C0] p-4',
        'rounded-xl bg-[#E0D5C0] p-4',
        'rounded-xl bg-[#777777] p-4',
      ]
    : [
        'rounded-xl bg-green-50 p-4',
        'rounded-xl bg-blue-50 p-4',
        'rounded-xl bg-amber-50 p-4',
        'rounded-xl bg-purple-50 p-4',
      ];
  const labelClasses = isDashboard
    ? [
        'text-xs font-semibold uppercase tracking-wide text-[#555555]',
        'text-xs font-semibold uppercase tracking-wide text-[#6A6257]',
        'text-xs font-semibold uppercase tracking-wide text-[#6c5b20]',
        'text-xs font-semibold uppercase tracking-wide text-[#F5F3EF]',
      ]
    : [
        'text-xs font-semibold uppercase tracking-wide text-green-700',
        'text-xs font-semibold uppercase tracking-wide text-blue-700',
        'text-xs font-semibold uppercase tracking-wide text-amber-700',
        'text-xs font-semibold uppercase tracking-wide text-purple-700',
      ];
  const valueClasses = isDashboard
    ? [
        'mt-1 text-2xl font-bold text-[#333333]',
        'mt-1 text-2xl font-bold text-[#2f3740]',
        'mt-1 text-2xl font-bold text-[#3f3413]',
        'mt-1 text-2xl font-bold text-white',
      ]
    : [
        'mt-1 text-2xl font-bold text-green-900',
        'mt-1 text-2xl font-bold text-blue-900',
        'mt-1 text-2xl font-bold text-amber-900',
        'mt-1 text-2xl font-bold text-purple-900',
      ];

  return (
    <div className={wrapperClass}>
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className={metricClasses[0]}>
          <p className={labelClasses[0]}>Helped Count</p>
          <p className={valueClasses[0]}>{summary.helped_count}</p>
        </div>
        <div className={metricClasses[1]}>
          <p className={labelClasses[1]}>Received Help</p>
          <p className={valueClasses[1]}>{summary.received_help_count}</p>
        </div>
        <div className={metricClasses[2]}>
          <p className={labelClasses[2]}>Helpful Feedback</p>
          <p className={valueClasses[2]}>
            {summary.feedback_count > 0 ? `${summary.helpful_feedback_count}/${summary.feedback_count}` : 'No ratings yet'}
          </p>
        </div>
        <div className={metricClasses[3]}>
          <p className={labelClasses[3]}>Helpful Rate</p>
          <p className={valueClasses[3]}>
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

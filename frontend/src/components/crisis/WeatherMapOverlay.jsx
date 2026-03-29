import React from 'react';

const formatRiskLabel = (risk) => risk.replace(/_/g, ' ');

const WeatherMapOverlay = ({ weatherSummary, overlayStyle, contextLabel = null }) => {
  if (!weatherSummary) {
    return contextLabel ? (
      <div className="absolute left-4 top-4 z-[1000] rounded-lg bg-white/95 px-3 py-2 text-xs font-semibold text-gray-700 shadow-md">
        {contextLabel}
      </div>
    ) : null;
  }

  const riskTags = weatherSummary.impact_summary?.risk_tags || [];
  const displaySummary = weatherSummary.display_summary || weatherSummary.summary || 'Weather unavailable';

  return (
    <div className="absolute left-4 top-4 z-[1000] max-w-xs space-y-2">
      {contextLabel && (
        <div className="rounded-lg bg-white/95 px-3 py-2 text-xs font-semibold text-gray-700 shadow-md">
          {contextLabel}
        </div>
      )}

      <div className={`rounded-xl border px-4 py-3 shadow-md backdrop-blur-sm ${overlayStyle.badgeClassName}`}>
        <p className="text-xs font-semibold uppercase tracking-wide opacity-75">Weather</p>
        <p className="mt-1 text-sm font-semibold">{weatherSummary.summary}</p>
        <p className="mt-1 text-xs leading-relaxed opacity-85">{displaySummary}</p>

        {riskTags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {riskTags.map((risk) => (
              <span key={risk} className="rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-semibold capitalize shadow-sm">
                {formatRiskLabel(risk)}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WeatherMapOverlay;

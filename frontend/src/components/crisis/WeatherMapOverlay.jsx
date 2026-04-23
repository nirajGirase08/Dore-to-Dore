import React, { useState } from 'react';

const formatRiskLabel = (risk) => risk.replace(/_/g, ' ');

/**
 * Positioned to sit immediately to the right of Leaflet's zoom control (+/-)
 * which lives at top:10px left:10px and is ~36px wide.
 */
const WeatherMapOverlay = ({ weatherSummary, overlayStyle, contextLabel = null }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="absolute z-[1000] flex flex-col gap-2" style={{ top: 10, left: 46 }}>
      {/* Top row: context label + weather icon (collapsed) */}
      <div className="flex items-center gap-2">
        {contextLabel && (
          <div className="rounded-lg bg-white/95 px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-md whitespace-nowrap">
            {contextLabel}
          </div>
        )}

        {weatherSummary && !open && (
          <button
            onClick={() => setOpen(true)}
            title="View weather summary"
            aria-label="Show weather summary"
            className={`flex items-center justify-center w-[26px] h-[26px] rounded shadow-md border backdrop-blur-sm hover:opacity-90 transition-opacity ${overlayStyle.badgeClassName}`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20A10 10 0 0012 2z" />
            </svg>
          </button>
        )}
      </div>

      {/* Expanded weather panel */}
      {open && weatherSummary && (
        <div className={`rounded-xl border px-4 py-3 shadow-md backdrop-blur-sm max-w-[240px] ${overlayStyle.badgeClassName}`}>
          <div className="flex items-center justify-between gap-2 mb-1">
            <p className="text-xs font-semibold uppercase tracking-wide opacity-75">Weather</p>
            <button
              onClick={() => setOpen(false)}
              className="opacity-60 hover:opacity-100 transition-opacity"
              aria-label="Close weather summary"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-sm font-semibold">{weatherSummary.summary}</p>
          <p className="mt-1 text-xs leading-relaxed opacity-85">
            {weatherSummary.display_summary || weatherSummary.summary}
          </p>
          {(weatherSummary.impact_summary?.risk_tags || []).length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {weatherSummary.impact_summary.risk_tags.map((risk) => (
                <span key={risk} className="rounded-full bg-white/80 px-2 py-0.5 text-[11px] font-semibold capitalize shadow-sm">
                  {formatRiskLabel(risk)}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WeatherMapOverlay;

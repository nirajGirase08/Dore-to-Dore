import React, { useEffect, useState } from 'react';
import { aiAPI } from '../../services/api';
import { useDemoContext } from '../../contexts/DemoContext';

const AISuggestionModal = ({ isOpen, mode, onClose, onApply }) => {
  const { demoEnabled, demoRange, getWeatherContextPayload } = useDemoContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!isOpen) {
      setLoading(false);
      setError('');
      setResult(null);
    }
  }, [isOpen]);

  useEffect(() => {
    setError('');
    setResult(null);
  }, [demoEnabled]);

  if (!isOpen) {
    return null;
  }

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await aiAPI.getSuggestion({
        mode,
        ...getWeatherContextPayload(),
      });
      setResult(response.data || null);
    } catch (err) {
      setError(err.message || 'Failed to generate suggestion.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Get AI Generated Suggestions</h2>
            <p className="mt-1 text-sm text-gray-600">
              Uses location, weather, road blockages, nearby essential places, and your posting history.
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-[1fr_auto]">
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
            {demoEnabled
              ? `${demoRange.label}. AI suggestions will use this weather window while blockages remain live/current.`
              : 'AI suggestions will use current weather.'}
          </div>
          <div className="flex items-end">
            <button onClick={handleGenerate} disabled={loading} className="btn-primary w-full md:w-auto">
              {loading ? 'Generating...' : 'Generate'}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {result && (
          <div className="mt-6 space-y-5">
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <h3 className="text-lg font-semibold text-gray-900">{result.suggestion?.suggested_title}</h3>
              <p className="mt-2 text-sm text-gray-700">{result.suggestion?.suggested_description}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {(result.suggestion?.suggested_items || []).map((item) => (
                  <span key={item} className="rounded-full bg-primary-100 px-3 py-1 text-xs font-semibold text-primary-800">
                    {item}
                  </span>
                ))}
              </div>
              {result.suggestion?.suggested_urgency && (
                <p className="mt-3 text-sm text-gray-600">
                  Suggested urgency: <span className="font-semibold capitalize">{result.suggestion.suggested_urgency}</span>
                </p>
              )}
            </div>

            <div className="rounded-xl border border-cyan-200 bg-cyan-50 p-4">
              <p className="text-sm font-semibold text-cyan-950">Why this was suggested</p>
              <p className="mt-2 text-sm text-cyan-900">{result.suggestion?.reasoning_summary}</p>
            </div>

            {(result.suggestion?.safety_notes || []).length > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-semibold text-amber-900">Safety notes</p>
                <ul className="mt-2 space-y-1 text-sm text-amber-800">
                  {result.suggestion.safety_notes.map((note) => (
                    <li key={note}>• {note}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="text-sm font-semibold text-gray-900">Context preview</p>
              <div className="mt-3 grid gap-4 md:grid-cols-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Weather</p>
                  <p className="mt-1 text-sm text-gray-700">
                    {result.context_preview?.weather?.display_summary
                      || result.context_preview?.weather?.summary
                      || 'No weather data'}
                  </p>
                  <p className="text-xs text-gray-500">
                    Mode: {result.weather_mode_used}
                    {result.weather_date_range_used?.start_date
                      ? ` (${result.weather_date_range_used.start_date}${
                        result.weather_date_range_used.end_date &&
                        result.weather_date_range_used.end_date !== result.weather_date_range_used.start_date
                          ? ` to ${result.weather_date_range_used.end_date}`
                          : ''
                      })`
                      : result.historical_weather_date_used
                        ? ` (${result.historical_weather_date_used})`
                        : ''}
                  </p>
                  <p className="mt-2 text-xs text-gray-500">
                    Risk tags: {(result.context_preview?.weather?.impact_summary?.risk_tags || []).join(', ') || 'none'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Nearby blockages</p>
                  <p className="mt-1 text-sm text-gray-700">
                    {result.context_preview?.nearby_blockages?.length || 0} found
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Nearby places</p>
                  <p className="mt-1 text-sm text-gray-700">
                    Essential places were included in the prompt context.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => onApply(result.suggestion)}
                className="btn-primary flex-1"
              >
                Use This Suggestion
              </button>
              <button onClick={onClose} className="btn-secondary flex-1">
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AISuggestionModal;

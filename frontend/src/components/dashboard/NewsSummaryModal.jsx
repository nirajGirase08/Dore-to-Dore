import React, { useEffect, useState } from 'react';
import { aiAPI } from '../../services/api';
import { useDemoContext } from '../../contexts/DemoContext';

const NewsSummaryModal = ({ isOpen, onClose }) => {
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
      const response = await aiAPI.getNewsSummary(getWeatherContextPayload());
      setResult(response.data || null);
    } catch (err) {
      setError(err.message || 'Failed to generate news summary.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">AI Summarized News</h2>
            <p className="mt-1 text-sm text-gray-600">
              Summarizes latest local headlines, selected weather context, and currently reported blockages.
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-[1fr_auto]">
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
            {demoEnabled
              ? `${demoRange.label}. News summaries will use this weather window.`
              : 'News summaries will use current weather and live headlines.'}
          </div>
          <div className="flex items-end">
            <button onClick={handleGenerate} disabled={loading} className="btn-primary w-full md:w-auto">
              {loading ? 'Summarizing...' : 'Generate'}
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
              <h3 className="text-lg font-semibold text-gray-900">{result.summary?.summary_title}</h3>
              <p className="mt-2 text-sm text-gray-700">{result.summary?.summary_text}</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-cyan-200 bg-cyan-50 p-4">
                <p className="text-sm font-semibold text-cyan-950">Weather Context</p>
                <p className="mt-2 text-sm text-cyan-900">{result.summary?.weather_summary}</p>
              </div>
              <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
                <p className="text-sm font-semibold text-orange-950">Blockages Reported</p>
                <p className="mt-2 text-sm text-orange-900">{result.summary?.blockage_summary}</p>
              </div>
            </div>

            {(result.summary?.key_points || []).length > 0 && (
              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <p className="text-sm font-semibold text-gray-900">Key Points</p>
                <ul className="mt-2 space-y-2 text-sm text-gray-700">
                  {result.summary.key_points.map((point) => (
                    <li key={point}>• {point}</li>
                  ))}
                </ul>
              </div>
            )}

            {(result.summary?.recommended_watchouts || []).length > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-semibold text-amber-900">Watchouts</p>
                <ul className="mt-2 space-y-2 text-sm text-amber-800">
                  {result.summary.recommended_watchouts.map((point) => (
                    <li key={point}>• {point}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="text-sm font-semibold text-gray-900">Latest Headlines</p>
              <div className="mt-3 space-y-3">
                {(result.headlines || []).map((headline) => (
                  <a
                    key={headline.link}
                    href={headline.link}
                    target="_blank"
                    rel="noreferrer"
                    className="block rounded-lg border border-gray-100 px-4 py-3 hover:bg-gray-50"
                  >
                    <p className="text-sm font-medium text-gray-900">{headline.title}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      {headline.source}
                      {headline.published_at ? ` • ${new Date(headline.published_at).toLocaleString()}` : ''}
                    </p>
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewsSummaryModal;

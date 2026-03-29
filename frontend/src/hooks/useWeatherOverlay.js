import { useEffect, useMemo, useState } from 'react';
import { weatherAPI } from '../services/api';
import { useDemoContext } from '../contexts/DemoContext';

const getOverlayStyle = (riskTags = []) => {
  if (riskTags.includes('ice_risk')) {
    return {
      color: '#60a5fa',
      fillColor: '#93c5fd',
      fillOpacity: 0.16,
      borderColor: '#dc2626',
      badgeClassName: 'border-blue-200 bg-blue-50 text-blue-950',
    };
  }

  if (riskTags.includes('snow_impact_risk')) {
    return {
      color: '#94a3b8',
      fillColor: '#cbd5e1',
      fillOpacity: 0.14,
      borderColor: '#dc2626',
      badgeClassName: 'border-slate-200 bg-slate-50 text-slate-950',
    };
  }

  if (riskTags.includes('heavy_precipitation_risk')) {
    return {
      color: '#0ea5e9',
      fillColor: '#7dd3fc',
      fillOpacity: 0.14,
      borderColor: '#dc2626',
      badgeClassName: 'border-cyan-200 bg-cyan-50 text-cyan-950',
    };
  }

  if (riskTags.includes('high_wind_risk')) {
    return {
      color: '#f59e0b',
      fillColor: '#fde68a',
      fillOpacity: 0.13,
      borderColor: '#dc2626',
      badgeClassName: 'border-amber-200 bg-amber-50 text-amber-950',
    };
  }

  return {
    color: '#d1d5db',
    fillColor: '#f3f4f6',
    fillOpacity: 0.1,
    borderColor: '#dc2626',
    badgeClassName: 'border-gray-200 bg-white text-gray-900',
  };
};

const shouldShowImpactZone = (riskTags = []) => (
  riskTags.includes('ice_risk') ||
  riskTags.includes('snow_impact_risk') ||
  riskTags.includes('heavy_precipitation_risk') ||
  riskTags.includes('high_wind_risk')
);

export const useWeatherOverlay = (user) => {
  const { getWeatherContextPayload, demoEnabled } = useDemoContext();
  const [weatherSummary, setWeatherSummary] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const loadWeatherSummary = async () => {
      try {
        const payload = getWeatherContextPayload();
        const response = await weatherAPI.getSummary({
          lat: user?.location_lat || undefined,
          lng: user?.location_lng || undefined,
          mode: payload.weather_mode,
          date: payload.historical_weather_date || undefined,
          start_date: payload.start_date || undefined,
          end_date: payload.end_date || undefined,
        });

        if (!cancelled) {
          setWeatherSummary(response.data || null);
        }
      } catch {
        if (!cancelled) {
          setWeatherSummary(null);
        }
      }
    };

    loadWeatherSummary();
    const intervalId = window.setInterval(loadWeatherSummary, demoEnabled ? 60000 : 300000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [demoEnabled, getWeatherContextPayload, user?.location_lat, user?.location_lng]);

  return useMemo(() => {
    const riskTags = weatherSummary?.impact_summary?.risk_tags || [];
    return {
      weatherSummary,
      riskTags,
      overlayStyle: getOverlayStyle(riskTags),
      showImpactZone: shouldShowImpactZone(riskTags),
    };
  }, [weatherSummary]);
};

export default useWeatherOverlay;

import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { getWeatherSummary } from '../services/weatherService.js';

const router = express.Router();

const buildWeatherAlerts = ({ currentSummary, next24Summary }) => {
  const alerts = [];

  const buildSeverity = (riskTags = []) => {
    if (riskTags.includes('ice_risk')) return 'critical';
    if (
      riskTags.includes('snow_impact_risk') ||
      riskTags.includes('heavy_precipitation_risk') ||
      riskTags.includes('high_wind_risk')
    ) {
      return 'high';
    }
    if (riskTags.includes('freezing_risk')) {
      return 'medium';
    }
    return null;
  };

  const pushAlert = (id, title, message, summary) => {
    const severity = buildSeverity(summary?.impact_summary?.risk_tags || []);
    if (!severity) return;

    alerts.push({
      notification_id: id,
      notification_type: 'weather_alert',
      title,
      message,
      severity,
      created_at: new Date().toISOString(),
    });
  };

  pushAlert(
    'weather-current',
    'Severe Weather Alert',
    currentSummary?.display_summary || currentSummary?.summary || 'Severe conditions detected.',
    currentSummary
  );

  if (next24Summary) {
    pushAlert(
      'weather-24h',
      'Weather Watch: Next 24 Hours',
      next24Summary?.display_summary || next24Summary?.summary || 'Severe conditions expected in the next 24 hours.',
      next24Summary
    );
  }

  return alerts;
};

router.get('/summary', authenticate, async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat || req.user.location_lat || 36.1447);
    const lng = parseFloat(req.query.lng || req.user.location_lng || -86.8027);
    const mode = req.query.mode;
    const historicalDate = req.query.date;
    const startDate = req.query.start_date;
    const endDate = req.query.end_date;

    const summary = await getWeatherSummary({
      lat,
      lng,
      mode,
      historicalDate,
      startDate,
      endDate,
    });

    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error('Weather summary error:', error);
    res.status(502).json({
      success: false,
      error: 'Failed to fetch weather summary.',
    });
  }
});

router.get('/alerts', authenticate, async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat || req.user.location_lat || 36.1447);
    const lng = parseFloat(req.query.lng || req.user.location_lng || -86.8027);
    const mode = req.query.weather_mode || req.query.mode;
    const startDate = req.query.start_date || null;
    const endDate = req.query.end_date || null;
    const historicalDate = req.query.historical_weather_date || req.query.date || null;

    if (mode === 'historical_range') {
      const historicalSummary = await getWeatherSummary({
        lat,
        lng,
        mode,
        startDate,
        endDate,
        historicalDate,
      });

      return res.json({
        success: true,
        data: {
          alerts: buildWeatherAlerts({
            currentSummary: historicalSummary,
            next24Summary: null,
          }),
        },
      });
    }

    const currentSummary = await getWeatherSummary({ lat, lng, mode: 'current' });
    const today = new Date().toISOString().slice(0, 10);
    const tomorrowDate = new Date(`${today}T00:00:00Z`);
    tomorrowDate.setUTCDate(tomorrowDate.getUTCDate() + 1);
    const tomorrow = tomorrowDate.toISOString().slice(0, 10);

    const next24Summary = await getWeatherSummary({
      lat,
      lng,
      mode: 'forecast_range',
      startDate: today,
      endDate: tomorrow,
    });

    res.json({
      success: true,
      data: {
        alerts: buildWeatherAlerts({ currentSummary, next24Summary }),
      },
    });
  } catch (error) {
    console.error('Weather alerts error:', error);
    res.status(502).json({
      success: false,
      error: 'Failed to fetch weather alerts.',
    });
  }
});

export default router;

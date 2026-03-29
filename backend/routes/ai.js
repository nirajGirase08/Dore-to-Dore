import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { buildSuggestionContext, generateSuggestion } from '../services/aiSuggestionService.js';
import { buildNewsSummaryContext, generateNewsSummary } from '../services/aiNewsSummaryService.js';

const router = express.Router();

router.post('/suggestions', authenticate, async (req, res) => {
  try {
    const {
      mode,
      weather_mode,
      historical_weather_date,
      start_date,
      end_date,
    } = req.body;

    if (!['offer', 'request'].includes(mode)) {
      return res.status(400).json({
        success: false,
        error: 'mode must be "offer" or "request".',
      });
    }

    const context = await buildSuggestionContext({
      user: req.user,
      mode,
      weatherMode: weather_mode,
      historicalDate: historical_weather_date,
      startDate: start_date,
      endDate: end_date,
    });

    const suggestion = await generateSuggestion({ mode, context });

    res.json({
      success: true,
      data: {
        mode,
        weather_mode_used: context.weather.mode,
        weather_date_range_used: context.weather.date_range || null,
        historical_weather_date_used: context.weather.mode === 'historical_range'
          ? context.weather.date_range?.start_date || context.weather.observed_at
          : null,
        context_preview: {
          weather: context.weather,
          nearby_blockages: context.nearby_blockages,
          nearby_places: context.nearby_places,
        },
        suggestion,
      },
    });
  } catch (error) {
    console.error('AI suggestion error:', error);
    res.status(502).json({
      success: false,
      error: error.message || 'Failed to generate AI suggestion.',
    });
  }
});

router.post('/news-summary', authenticate, async (req, res) => {
  try {
    const {
      weather_mode,
      historical_weather_date,
      start_date,
      end_date,
    } = req.body;

    const context = await buildNewsSummaryContext({
      user: req.user,
      weatherMode: weather_mode,
      historicalDate: historical_weather_date,
      startDate: start_date,
      endDate: end_date,
    });

    const summary = await generateNewsSummary(context);

    res.json({
      success: true,
      data: {
        weather_mode_used: context.weather.mode,
        weather_date_range_used: context.weather.date_range || null,
        summary,
        headlines: context.headlines,
        news_query_used: context.news_query,
        context_preview: {
          weather: context.weather,
          blockages: context.blockages,
        },
      },
    });
  } catch (error) {
    console.error('AI news summary error:', error);
    res.status(502).json({
      success: false,
      error: error.message || 'Failed to generate AI news summary.',
    });
  }
});

export default router;

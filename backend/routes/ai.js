import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { buildSuggestionContext, generateSuggestion } from '../services/aiSuggestionService.js';

const router = express.Router();

router.post('/suggestions', authenticate, async (req, res) => {
  try {
    const { mode, weather_mode, historical_weather_date } = req.body;

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
    });

    const suggestion = await generateSuggestion({ mode, context });

    res.json({
      success: true,
      data: {
        mode,
        weather_mode_used: context.weather.mode,
        historical_weather_date_used: context.weather.mode === 'historical' ? context.weather.observed_at : null,
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

export default router;

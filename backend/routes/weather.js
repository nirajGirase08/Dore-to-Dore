import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { getWeatherSummary } from '../services/weatherService.js';

const router = express.Router();

router.get('/summary', authenticate, async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat || req.user.location_lat || 36.1447);
    const lng = parseFloat(req.query.lng || req.user.location_lng || -86.8027);
    const mode = req.query.mode;
    const historicalDate = req.query.date;

    const summary = await getWeatherSummary({ lat, lng, mode, historicalDate });

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

export default router;

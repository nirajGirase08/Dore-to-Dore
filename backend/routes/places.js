import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { getNearbyPlaces, summarizeNearbyPlaces } from '../services/locationContextService.js';

const router = express.Router();

router.get('/nearby', authenticate, async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat || req.user.location_lat || 36.1447);
    const lng = parseFloat(req.query.lng || req.user.location_lng || -86.8027);
    const radiusKm = parseFloat(req.query.radius_km || 8);

    const places = await getNearbyPlaces({ lat, lng, radiusKm });

    res.json({
      success: true,
      data: summarizeNearbyPlaces(places),
    });
  } catch (error) {
    console.error('Nearby places error:', error);
    res.status(502).json({
      success: false,
      error: 'Failed to fetch nearby places.',
    });
  }
});

export default router;

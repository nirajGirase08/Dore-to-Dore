import express from 'express';

const router = express.Router();

// In-memory cache — fetch from Overpass once per server session
let cachedFacilities = null;

const OVERPASS_QUERY = `
[out:json][timeout:25];
(
  node["amenity"="hospital"](35.96,-87.10,36.40,-86.50);
  way["amenity"="hospital"](35.96,-87.10,36.40,-86.50);
  node["amenity"="clinic"](35.96,-87.10,36.40,-86.50);
  way["amenity"="clinic"](35.96,-87.10,36.40,-86.50);
  node["healthcare"="urgent_care"](35.96,-87.10,36.40,-86.50);
  node["amenity"="urgent_care"](35.96,-87.10,36.40,-86.50);
);
out center;
`.trim();

/**
 * GET /api/medical-facilities
 * Proxies Overpass API server-side (avoids browser CORS issues).
 * Cached in memory after first fetch.
 */
router.get('/', async (req, res) => {
  try {
    if (cachedFacilities) {
      return res.json({ success: true, data: cachedFacilities });
    }

    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body:    'data=' + encodeURIComponent(OVERPASS_QUERY),
    });

    if (!response.ok) throw new Error(`Overpass ${response.status}`);

    const overpassData = await response.json();

    const facilities = overpassData.elements
      .map((el) => {
        const lat = el.lat ?? el.center?.lat;
        const lng = el.lon  ?? el.center?.lon;
        if (!lat || !lng) return null;

        const amenity = el.tags?.amenity || el.tags?.healthcare || '';
        return {
          name:  el.tags?.name || 'Unnamed facility',
          type:  amenity === 'hospital' ? 'hospital' : 'urgent_care',
          lat,
          lng,
          phone: el.tags?.phone || el.tags?.['contact:phone'] || '',
        };
      })
      .filter(Boolean);

    cachedFacilities = facilities;
    res.json({ success: true, data: facilities });
  } catch (err) {
    console.error('Medical facilities fetch error:', err.message);
    res.status(502).json({ success: false, error: 'Could not fetch medical facilities.' });
  }
});

export default router;

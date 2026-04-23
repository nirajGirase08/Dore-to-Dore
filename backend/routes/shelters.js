import express from 'express';

const router = express.Router();

// Cache shelters for the server session (same pattern as medicalFacilities.js)
let cachedShelters = null;

// Nashville bounding box — same as medical facilities
const BBOX = '35.96,-87.10,36.40,-86.50';

const OVERPASS_QUERY = `
[out:json][timeout:25];
(
  node["social_facility"="shelter"](${BBOX});
  way["social_facility"="shelter"](${BBOX});
  node["amenity"="shelter"](${BBOX});
  node["emergency"="assembly_point"](${BBOX});
  node["disaster_relief"="yes"](${BBOX});
  node["social_facility"="emergency_housing"](${BBOX});
);
out center;
`.trim();

/**
 * GET /api/shelters
 * Proxies Overpass API server-side to fetch emergency shelters near Nashville.
 * Cached in memory after first fetch.
 */
router.get('/', async (req, res) => {
  try {
    if (cachedShelters) {
      return res.json({ success: true, data: cachedShelters });
    }

    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method:  'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'CrisisConnect/1.0',
      },
      body:    'data=' + encodeURIComponent(OVERPASS_QUERY),
    });

    if (!response.ok) throw new Error(`Overpass ${response.status}`);

    const overpassData = await response.json();

    const shelters = overpassData.elements
      .map((el) => {
        const lat = el.lat ?? el.center?.lat;
        const lng = el.lon  ?? el.center?.lon;
        if (!lat || !lng) return null;
        return {
          name:    el.tags?.name || el.tags?.['name:en'] || 'Emergency Shelter',
          type:    el.tags?.social_facility || el.tags?.amenity || el.tags?.emergency || 'shelter',
          lat,
          lng,
          address: el.tags?.['addr:full'] || el.tags?.['addr:street'] || '',
          phone:   el.tags?.phone || el.tags?.['contact:phone'] || '',
          capacity: el.tags?.capacity || '',
        };
      })
      .filter(Boolean);

    cachedShelters = shelters;
    res.json({ success: true, data: shelters });
  } catch (err) {
    console.error('Shelters fetch error:', err.message);
    // Return empty array (not a hard failure — shelters are supplemental info)
    res.json({ success: true, data: [] });
  }
});

export default router;

import { Op } from 'sequelize';
import Blockage from '../models/Blockage.js';

const haversineKm = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const OVERPASS_CATEGORY_QUERIES = {
  hospitals: ['["amenity"="hospital"]', '["amenity"="clinic"]', '["healthcare"="urgent_care"]'],
  pharmacies: ['["amenity"="pharmacy"]', '["shop"="chemist"]'],
  supermarkets: ['["shop"="supermarket"]', '["shop"="convenience"]', '["shop"="grocery"]'],
  hardware_stores: ['["shop"="hardware"]', '["shop"="doityourself"]'],
  gas_stations: ['["amenity"="fuel"]'],
};

const buildOverpassQuery = (lat, lng, radiusMeters) => {
  const categorySections = Object.values(OVERPASS_CATEGORY_QUERIES)
    .flat()
    .map((selector) => `node${selector}(around:${radiusMeters},${lat},${lng});way${selector}(around:${radiusMeters},${lat},${lng});`)
    .join('\n');

  return `
[out:json][timeout:25];
(
${categorySections}
);
out center;
  `.trim();
};

const mapPlaceCategory = (tags = {}) => {
  const amenity = tags.amenity || '';
  const healthcare = tags.healthcare || '';
  const shop = tags.shop || '';

  if (amenity === 'hospital' || amenity === 'clinic' || healthcare === 'urgent_care') {
    return 'hospitals';
  }

  if (amenity === 'pharmacy' || shop === 'chemist') {
    return 'pharmacies';
  }

  if (shop === 'supermarket' || shop === 'convenience' || shop === 'grocery') {
    return 'supermarkets';
  }

  if (shop === 'hardware' || shop === 'doityourself') {
    return 'hardware_stores';
  }

  if (amenity === 'fuel') {
    return 'gas_stations';
  }

  return null;
};

export const getNearbyPlaces = async ({ lat, lng, radiusKm = 8 }) => {
  const radiusMeters = Math.round(radiusKm * 1000);

  const empty = { hospitals: [], pharmacies: [], supermarkets: [], hardware_stores: [], gas_stations: [] };

  let response;
  try {
    response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'CrisisConnect/1.0',
      },
      body: `data=${encodeURIComponent(buildOverpassQuery(lat, lng, radiusMeters))}`,
    });
  } catch (err) {
    console.error('Overpass fetch error (nearby places):', err.message);
    return empty;
  }

  if (!response.ok) {
    console.error(`Overpass nearby places returned ${response.status}`);
    return empty;
  }

  let data;
  try {
    data = await response.json();
  } catch (err) {
    console.error('Overpass nearby places JSON parse error:', err.message);
    return empty;
  }

  const grouped = {
    hospitals: [],
    pharmacies: [],
    supermarkets: [],
    hardware_stores: [],
    gas_stations: [],
  };

  (data.elements || []).forEach((element) => {
    const category = mapPlaceCategory(element.tags);
    const placeLat = element.lat ?? element.center?.lat;
    const placeLng = element.lon ?? element.center?.lon;

    if (!category || placeLat == null || placeLng == null) {
      return;
    }

    grouped[category].push({
      name: element.tags?.name || 'Unnamed place',
      lat: placeLat,
      lng: placeLng,
      address: element.tags?.['addr:full'] || element.tags?.['addr:street'] || '',
      distance_km: haversineKm(lat, lng, placeLat, placeLng),
    });
  });

  Object.keys(grouped).forEach((key) => {
    grouped[key] = grouped[key]
      .sort((a, b) => a.distance_km - b.distance_km)
      .slice(0, 5);
  });

  return grouped;
};

export const getNearbyBlockages = async ({ lat, lng, radiusKm = 5 }) => {
  const blockages = await Blockage.findAll({
    where: {
      status: {
        [Op.in]: ['reported', 'verified', 'active'],
      },
    },
    order: [['created_at', 'DESC']],
  });

  return blockages
    .filter((blockage) => blockage.location_lat != null && blockage.location_lng != null)
    .map((blockage) => ({
      ...blockage.toJSON(),
      distance_km: haversineKm(
        lat,
        lng,
        parseFloat(blockage.location_lat),
        parseFloat(blockage.location_lng)
      ),
    }))
    .filter((blockage) => blockage.distance_km <= radiusKm)
    .sort((a, b) => a.distance_km - b.distance_km)
    .slice(0, 8);
};

export const summarizeNearbyPlaces = (places) => Object.fromEntries(
  Object.entries(places).map(([category, entries]) => [
    category,
    entries.map((entry) => ({
      name: entry.name,
      distance_km: Number(entry.distance_km.toFixed(2)),
    })),
  ])
);

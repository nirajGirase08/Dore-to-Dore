const MAPBOX_TOKEN = process.env.MAPBOX_ACCESS_TOKEN;
const GEOCODING_BASE = 'https://api.mapbox.com/geocoding/v5/mapbox.places';

/**
 * Geocode a street address to lat/lng using Mapbox.
 * Appends ', Nashville, TN' for improved local accuracy.
 * Returns { lat, lng, formatted_address } or null.
 */
export const geocodeAddress = async (address) => {
  if (!MAPBOX_TOKEN) {
    console.warn('[Geocoding] MAPBOX_ACCESS_TOKEN not set — skipping geocoding');
    return null;
  }
  try {
    const query = encodeURIComponent(`${address}, Nashville, TN`);
    const url = `${GEOCODING_BASE}/${query}.json?access_token=${MAPBOX_TOKEN}&limit=1`;
    const response = await fetch(url);
    const data = await response.json();
    if (!data.features?.length) return null;
    const [lng, lat] = data.features[0].center;
    return { lat, lng, formatted_address: data.features[0].place_name };
  } catch (err) {
    console.error('[Geocoding] geocodeAddress error:', err.message);
    return null;
  }
};

/**
 * Reverse geocode lat/lng to a human-readable address using Mapbox.
 * Returns address string or null.
 */
export const reverseGeocode = async (lat, lng) => {
  if (!MAPBOX_TOKEN) {
    console.warn('[Geocoding] MAPBOX_ACCESS_TOKEN not set — skipping reverse geocoding');
    return null;
  }
  try {
    const url = `${GEOCODING_BASE}/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&limit=1`;
    const response = await fetch(url);
    const data = await response.json();
    if (!data.features?.length) return null;
    return data.features[0].place_name;
  } catch (err) {
    console.error('[Geocoding] reverseGeocode error:', err.message);
    return null;
  }
};

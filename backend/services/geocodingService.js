const MAPBOX_TOKEN = process.env.MAPBOX_ACCESS_TOKEN;
const GEOCODING_BASE = 'https://api.mapbox.com/geocoding/v5/mapbox.places';
const NASHVILLE_VIEWBOX = '-87.10,36.40,-86.50,35.96';

/**
 * Geocode via Nominatim (free, no key required). Nashville-biased.
 */
const geocodeNominatim = async (address) => {
  try {
    const query = encodeURIComponent(address);
    const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&countrycodes=us&viewbox=${NASHVILLE_VIEWBOX}&bounded=0`;
    const response = await fetch(url, { headers: { 'User-Agent': 'DoreToDore/1.0' } });
    const data = await response.json();
    if (!data?.length) return null;
    return {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
      formatted_address: data[0].display_name,
    };
  } catch (err) {
    console.error('[Geocoding] Nominatim error:', err.message);
    return null;
  }
};

/**
 * Geocode a street address to lat/lng.
 * Uses Mapbox if token is set, otherwise falls back to Nominatim.
 * Returns { lat, lng, formatted_address } or null.
 */
export const geocodeAddress = async (address) => {
  if (MAPBOX_TOKEN) {
    try {
      const query = encodeURIComponent(`${address}, Nashville, TN`);
      const url = `${GEOCODING_BASE}/${query}.json?access_token=${MAPBOX_TOKEN}&limit=1`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.features?.length) {
        const [lng, lat] = data.features[0].center;
        return { lat, lng, formatted_address: data.features[0].place_name };
      }
    } catch (err) {
      console.error('[Geocoding] Mapbox error:', err.message);
    }
  }
  // Fallback to Nominatim
  console.info('[Geocoding] Using Nominatim fallback for:', address);
  return geocodeNominatim(address);
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

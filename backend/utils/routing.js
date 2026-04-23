import { Op } from 'sequelize';
import Blockage from '../models/Blockage.js';

const OSRM_BASE = 'https://router.project-osrm.org/route/v1/driving';

// ── Helpers ──────────────────────────────────────────────────────────────────

const distanceMetres = (lat1, lng1, lat2, lng2) => {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const distanceToSegmentMetres = (pLat, pLng, aLat, aLng, bLat, bLng) => {
  const toRad = (d) => (d * Math.PI) / 180;
  const midLat = toRad((aLat + bLat) / 2);
  const cosLat = Math.cos(midLat);

  const ax = aLng * cosLat, ay = aLat;
  const bx = bLng * cosLat, by = bLat;
  const px = pLng * cosLat, py = pLat;

  const dx = bx - ax, dy = by - ay;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return distanceMetres(pLat, pLng, aLat, aLng);

  let t = ((px - ax) * dx + (py - ay) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  return distanceMetres(pLat, pLng, aLat + t * (bLat - aLat), aLng + t * (bLng - aLng));
};

const routePassesNearBlockage = (coordinates, blockages, thresholdM = 300) => {
  const warnings = [];
  for (const blockage of blockages) {
    const bLat = parseFloat(blockage.location_lat);
    const bLng = parseFloat(blockage.location_lng);
    if (isNaN(bLat) || isNaN(bLng)) continue;

    let minDist = Infinity;
    for (let i = 0; i < coordinates.length - 1; i++) {
      const [aLng, aLat] = coordinates[i];
      const [cLng, cLat] = coordinates[i + 1];
      const d = distanceToSegmentMetres(bLat, bLng, aLat, aLng, cLat, cLng);
      if (d < minDist) minDist = d;
      if (minDist <= thresholdM) break;
    }
    if (minDist <= thresholdM) {
      warnings.push({
        blockage_id: blockage.blockage_id,
        type:        blockage.blockage_type,
        severity:    blockage.severity,
        address:     blockage.location_address,
        lat:         bLat,
        lng:         bLng,
        distance_m:  Math.round(minDist),
      });
    }
  }
  return warnings;
};

const severityScore = (s) => ({ critical: 4, high: 3, medium: 2, low: 1 }[s] ?? 0);
const maxSeverity   = (route) =>
  route.blockage_warnings.reduce((m, w) => Math.max(m, severityScore(w.severity)), 0);
const isSafeRoute   = (route) => maxSeverity(route) <= 1; // low-severity blockages are OK

const buildRoute = (osrmRoute, blockages, label) => {
  const coordinates = osrmRoute.geometry.coordinates;
  const warnings    = routePassesNearBlockage(coordinates, blockages);
  return {
    label,
    distance_m:        Math.round(osrmRoute.distance),
    distance_km:       (osrmRoute.distance / 1000).toFixed(1),
    duration_s:        Math.round(osrmRoute.duration),
    duration_min:      Math.round(osrmRoute.duration / 60),
    geometry:          osrmRoute.geometry,
    blockage_warnings: warnings,
    has_blockages:     warnings.length > 0,
    rerouted_due_to_hazard: false,
    avoided_hazards:        [],
    no_safe_alternative:    false,
  };
};

// ── OSRM fetch with timeout + retry ──────────────────────────────────────────

const osrmFetch = async (url) => {
  const TIMEOUT_MS  = 15000;
  const MAX_RETRIES = 2;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timer      = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`OSRM HTTP ${res.status}`);
      const data = await res.json();
      if (data.code !== 'Ok' || !data.routes?.length) throw new Error('No routes returned by OSRM');
      return data;
    } catch (err) {
      clearTimeout(timer);
      console.warn(`[routing] OSRM attempt ${attempt}/${MAX_RETRIES} failed: ${err.message}`);
      if (attempt === MAX_RETRIES) throw err;
      await new Promise((r) => setTimeout(r, 1500)); // brief pause before retry
    }
  }
};

// ── Bypass route via perpendicular waypoint ──────────────────────────────────

const generateBypassPoints = (hazardLat, hazardLng, pickupLat, pickupLng, destLat, destLng, offsetM = 700) => {
  const cosLat = Math.cos((hazardLat * Math.PI) / 180);
  const dLatM  = (destLat - pickupLat) * 111000;
  const dLngM  = (destLng - pickupLng) * 111000 * cosLat;
  const perpLatM = -dLngM, perpLngM = dLatM;
  const perpLen  = Math.sqrt(perpLatM ** 2 + perpLngM ** 2);
  if (perpLen === 0) return [];
  const oLatDeg = (perpLatM / perpLen) * offsetM / 111000;
  const oLngDeg = (perpLngM / perpLen) * offsetM / (111000 * cosLat);
  return [
    { lat: hazardLat + oLatDeg, lng: hazardLng + oLngDeg },
    { lat: hazardLat - oLatDeg, lng: hazardLng - oLngDeg },
  ];
};

const fetchViaRoute = async (pickupLat, pickupLng, viaLat, viaLng, destLat, destLng) => {
  const url =
    `${OSRM_BASE}/${pickupLng},${pickupLat};${viaLng},${viaLat};${destLng},${destLat}` +
    `?overview=full&geometries=geojson&steps=false`;
  try {
    const data = await osrmFetch(url);
    return data.routes?.[0] ?? null;
  } catch {
    return null;
  }
};

// ── Straight-line fallback when OSRM is unavailable ──────────────────────────

const straightLineFallback = (pickupLat, pickupLng, destLat, destLng, blockages = []) => {
  const distance_m = distanceMetres(pickupLat, pickupLng, destLat, destLng);
  const coords     = [[pickupLng, pickupLat], [destLng, destLat]];
  const warnings   = routePassesNearBlockage(coords, blockages);
  return {
    label:                   'primary',
    distance_m:              Math.round(distance_m),
    distance_km:             (distance_m / 1000).toFixed(1),
    duration_s:              Math.round((distance_m / 1000 / 30) * 3600), // ~30 km/h urban
    duration_min:            Math.round((distance_m / 1000 / 30) * 60),
    geometry:                { type: 'LineString', coordinates: coords },
    blockage_warnings:       warnings,
    has_blockages:           warnings.length > 0,
    rerouted_due_to_hazard:  false,
    avoided_hazards:         [],
    no_safe_alternative:     false,
    is_estimated:            true,  // flag so the UI can show "Approximate route"
  };
};

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Returns 1 or 2 routes:
 *   routes[0] — recommended route (safe or best available)
 *   routes[1] — hazard-free alternative (only present when routes[0] has a hazard)
 */
export const computeRoutes = async (pickupLat, pickupLng, destLat, destLng) => {
  // 1. Load blockages first (needed for both OSRM path and straight-line fallback)
  const blockages = await Blockage.findAll({
    where: {
      status: { [Op.in]: ['active', 'reported', 'verified'] },
      [Op.or]: [
        { expires_at: null },
        { expires_at: { [Op.gt]: new Date() } },
      ],
    },
  });

  // 2. Try OSRM — fall back to straight line if it fails
  let data;
  try {
    const url =
      `${OSRM_BASE}/${pickupLng},${pickupLat};${destLng},${destLat}` +
      `?overview=full&geometries=geojson&alternatives=true&steps=false`;
    data = await osrmFetch(url);
  } catch (err) {
    console.warn(`[routing] OSRM unavailable — returning straight-line fallback: ${err.message}`);
    return [straightLineFallback(pickupLat, pickupLng, destLat, destLng, blockages)];
  }

  console.log(`[routing] ${blockages.length} blockage(s), ${data.routes.length} OSRM route(s)`);

  // 3. Evaluate each OSRM route for blockages
  const candidates = data.routes
    .slice(0, 3)
    .map((r, i) => buildRoute(r, blockages, i === 0 ? 'primary' : `alt-${i}`));

  // 4. Pick the best safe route as the recommendation
  const safeCandidates = candidates.filter(isSafeRoute);
  const recommended    = safeCandidates.length > 0 ? safeCandidates[0] : candidates[0];

  // 5. If recommended has hazards, try to find a bypass via perpendicular waypoint
  let alternative = null;

  if (!isSafeRoute(recommended) && blockages.length > 0) {
    const worstHazard = [...recommended.blockage_warnings]
      .sort((a, b) => severityScore(b.severity) - severityScore(a.severity))[0];

    if (worstHazard) {
      const bypassPoints = generateBypassPoints(
        worstHazard.lat, worstHazard.lng,
        pickupLat, pickupLng, destLat, destLng,
      );

      for (const bp of bypassPoints) {
        const osrmBypass = await fetchViaRoute(pickupLat, pickupLng, bp.lat, bp.lng, destLat, destLng);
        if (!osrmBypass) continue;
        const bypassRoute = buildRoute(osrmBypass, blockages, 'bypass');
        if (isSafeRoute(bypassRoute)) {
          alternative = bypassRoute;
          alternative.is_bypass = true;
          console.log(`[routing] Bypass found: ${alternative.distance_km}km, ${alternative.duration_min}min`);
          break;
        }
      }

      // If no bypass found, use the safest OSRM alternative (if any is safer)
      if (!alternative) {
        const safestOther = candidates
          .filter((r) => r !== recommended)
          .sort((a, b) => maxSeverity(a) - maxSeverity(b))[0];
        if (safestOther && maxSeverity(safestOther) < maxSeverity(recommended)) {
          alternative = safestOther;
        }
      }

      recommended.rerouted_due_to_hazard = !!alternative;
      recommended.no_safe_alternative    = !alternative;
    }
  }

  // 6. Return recommended first, alternative second (if found)
  const result = [recommended];
  if (alternative) result.push(alternative);

  console.log(
    `[routing] Result: ${result.length} route(s) — ` +
    `recommended has_blockages=${recommended.has_blockages}, ` +
    `rerouted=${recommended.rerouted_due_to_hazard}, ` +
    `no_safe_alt=${recommended.no_safe_alternative}`
  );

  return result;
};

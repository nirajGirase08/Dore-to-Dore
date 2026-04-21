import { Op } from 'sequelize';
import Blockage from '../models/Blockage.js';

const OSRM_BASE = 'https://router.project-osrm.org/route/v1/driving';

// Haversine distance in metres between two lat/lng points
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

/**
 * Shortest distance (metres) from point P to the line segment A→B.
 * Uses flat-earth projection — accurate enough for segments < 10 km.
 */
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

/**
 * For each active blockage, find its minimum distance to any segment of the route.
 * Returns warning objects for blockages within thresholdM metres.
 */
const routePassesNearBlockage = (coordinates, blockages, thresholdM = 300) => {
  const warnings = [];

  for (const blockage of blockages) {
    const bLat = parseFloat(blockage.location_lat);
    const bLng = parseFloat(blockage.location_lng);

    if (isNaN(bLat) || isNaN(bLng)) {
      console.warn(`[routing] Blockage ${blockage.blockage_id} SKIPPED — no valid coordinates (lat=${blockage.location_lat}, lng=${blockage.location_lng})`);
      continue;
    }

    let minDist = Infinity;

    for (let i = 0; i < coordinates.length - 1; i++) {
      const [aLng, aLat] = coordinates[i];       // GeoJSON = [lng, lat]
      const [cLng, cLat] = coordinates[i + 1];

      const d = distanceToSegmentMetres(bLat, bLng, aLat, aLng, cLat, cLng);
      if (d < minDist) minDist = d;
      if (minDist <= thresholdM) break; // optimisation: already confirmed a hit
    }

    const hit = minDist <= thresholdM;
    console.log(
      `[routing] Blockage ${blockage.blockage_id} (${blockage.blockage_type}) ` +
      `at (${bLat.toFixed(5)}, ${bLng.toFixed(5)}) — ` +
      `min dist: ${Math.round(minDist)}m — ` +
      (hit ? `*** HIT (threshold ${thresholdM}m) ***` : `miss (threshold ${thresholdM}m)`)
    );

    if (hit) {
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

/** Numeric severity: critical=4, high=3, medium=2, low=1, none=0 */
const severityScore = (s) => ({ critical: 4, high: 3, medium: 2, low: 1 }[s] ?? 0);

/** Highest severity score across all blockage warnings on a route */
const maxSeverity = (route) =>
  route.blockage_warnings.reduce((m, w) => Math.max(m, severityScore(w.severity)), 0);

/**
 * A route is "safe" if it has no blockages with severity > low.
 * medium / high / critical trigger rerouting.
 */
const isSafeRoute = (route) => maxSeverity(route) <= 1;

/**
 * Build a normalised route object from a raw OSRM route + blockage check.
 */
const buildRoute = (osrmRoute, blockages, idx) => {
  const coordinates = osrmRoute.geometry.coordinates; // [lng, lat] pairs
  const warnings = routePassesNearBlockage(coordinates, blockages);

  const lats = coordinates.map(([, lat]) => lat);
  const lngs = coordinates.map(([lng]) => lng);
  console.log(
    `[routing] Route ${idx} bbox: lat [${Math.min(...lats).toFixed(5)}, ${Math.max(...lats).toFixed(5)}] ` +
    `lng [${Math.min(...lngs).toFixed(5)}, ${Math.max(...lngs).toFixed(5)}] — ${coordinates.length} pts, ${warnings.length} hazard(s)`
  );

  return {
    index:             idx,
    distance_m:        Math.round(osrmRoute.distance),
    distance_km:       (osrmRoute.distance / 1000).toFixed(1),
    duration_s:        Math.round(osrmRoute.duration),
    duration_min:      Math.round(osrmRoute.duration / 60),
    geometry:          osrmRoute.geometry,
    steps:             osrmRoute.legs?.[0]?.steps?.map((s) => ({
      instruction: s.maneuver?.instruction || s.name,
      distance_m:  Math.round(s.distance),
      name:        s.name,
    })) || [],
    blockage_warnings: warnings,
    has_blockages:     warnings.length > 0,
  };
};

/**
 * Generate two candidate bypass waypoints perpendicular to the pickup→destination
 * direction, offset by offsetM metres on either side of the hazard.
 *
 * This lets us build a via-waypoint OSRM request that steers around the hazard.
 */
const generateBypassPoints = (hazardLat, hazardLng, pickupLat, pickupLng, destLat, destLng, offsetM = 600) => {
  const cosLat = Math.cos((hazardLat * Math.PI) / 180);

  // Route direction vector in metres
  const dLatM = (destLat - pickupLat) * 111000;
  const dLngM = (destLng - pickupLng) * 111000 * cosLat;

  // Perpendicular direction in metres (rotate 90°)
  const perpLatM = -dLngM;
  const perpLngM =  dLatM;
  const perpLen  = Math.sqrt(perpLatM ** 2 + perpLngM ** 2);
  if (perpLen === 0) return [];

  // Scale to desired offset distance
  const oLatDeg = (perpLatM / perpLen) * offsetM / 111000;
  const oLngDeg = (perpLngM / perpLen) * offsetM / (111000 * cosLat);

  return [
    { lat: hazardLat + oLatDeg, lng: hazardLng + oLngDeg },
    { lat: hazardLat - oLatDeg, lng: hazardLng - oLngDeg },
  ];
};

/**
 * Ask OSRM for a single route that passes through a via-waypoint.
 * Returns the raw OSRM route object, or null on any failure.
 */
const fetchViaRoute = async (pickupLat, pickupLng, viaLat, viaLng, destLat, destLng) => {
  const url =
    `${OSRM_BASE}/${pickupLng},${pickupLat};${viaLng},${viaLat};${destLng},${destLat}` +
    `?overview=full&geometries=geojson&steps=true`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.code !== 'Ok' || !data.routes?.[0]) return null;
    return data.routes[0];
  } catch {
    return null;
  }
};

/**
 * Compute up to 3 driving routes between two points using the public OSRM API.
 * Each route is checked against active blockages.
 * If all OSRM alternatives pass through a hazard, a bypass route is attempted
 * by routing via a perpendicular waypoint around the worst blockage.
 */
export const computeRoutes = async (pickupLat, pickupLng, destLat, destLng) => {
  const url =
    `${OSRM_BASE}/${pickupLng},${pickupLat};${destLng},${destLat}` +
    `?overview=full&geometries=geojson&alternatives=3&steps=true`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000); // 8s timeout
  let response;
  try {
    response = await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
  if (!response.ok) throw new Error(`OSRM error: ${response.status}`);

  const data = await response.json();
  if (data.code !== 'Ok' || !data.routes?.length) {
    throw new Error('No routes found between these locations');
  }

  // Fetch all active, non-expired blockages
  const now = new Date();
  const blockages = await Blockage.findAll({
    where: {
      status: 'active',
      [Op.or]: [
        { expires_at: null },
        { expires_at: { [Op.gt]: now } },
      ],
    },
  });

  console.log(`[routing] ${blockages.length} active blockage(s), ${data.routes.length} OSRM route(s) returned`);
  blockages.forEach((b) => {
    console.log(`[routing]   blockage #${b.blockage_id}: lat=${b.location_lat}, lng=${b.location_lng}, type=${b.blockage_type}, severity=${b.severity}`);
  });

  // Bug fix: use ALL alternatives OSRM returned (was slice(0,2), missing the 3rd)
  const routes = data.routes.slice(0, 3).map((route, idx) => buildRoute(route, blockages, idx + 1));

  // If every OSRM route passes through a hazard, try generating a bypass route
  // by adding a via-waypoint perpendicular to the hazard location
  if (routes.every((r) => !isSafeRoute(r)) && blockages.length > 0) {
    // Pick the highest-severity hazard on the fastest route
    const worstHazard = [...routes[0].blockage_warnings]
      .sort((a, b) => severityScore(b.severity) - severityScore(a.severity))[0];

    if (worstHazard) {
      console.log(
        `[routing] All ${routes.length} route(s) unsafe — attempting bypass around blockage #${worstHazard.blockage_id} ` +
        `(${worstHazard.type}, ${worstHazard.severity}) at (${worstHazard.lat.toFixed(5)}, ${worstHazard.lng.toFixed(5)})`
      );

      const bypassPoints = generateBypassPoints(
        worstHazard.lat, worstHazard.lng,
        pickupLat, pickupLng, destLat, destLng,
        700  // metres offset — large enough to clear the hazard zone
      );

      for (const bp of bypassPoints) {
        console.log(`[routing]   trying bypass waypoint (${bp.lat.toFixed(5)}, ${bp.lng.toFixed(5)})`);
        const osrmBypass = await fetchViaRoute(pickupLat, pickupLng, bp.lat, bp.lng, destLat, destLng);
        if (!osrmBypass) { console.log(`[routing]   bypass OSRM call failed`); continue; }

        const bypassRoute = buildRoute(osrmBypass, blockages, routes.length + 1);
        if (isSafeRoute(bypassRoute)) {
          bypassRoute.is_bypass = true;
          routes.push(bypassRoute);
          console.log(`[routing]   bypass route found: ${bypassRoute.distance_km}km, ${bypassRoute.duration_min}min, 0 serious hazards`);
          break;
        } else {
          console.log(`[routing]   bypass route still has hazards — trying other side`);
        }
      }
    }
  }

  // The route OSRM considered fastest (before hazard-aware sorting)
  const osrmFastest = routes[0];

  // Sort: safe routes first → lower severity → faster duration
  routes.sort((a, b) => {
    const aSafe = isSafeRoute(a);
    const bSafe = isSafeRoute(b);
    if (aSafe !== bSafe) return aSafe ? -1 : 1;
    const severityDiff = maxSeverity(a) - maxSeverity(b);
    if (severityDiff !== 0) return severityDiff;
    return a.duration_s - b.duration_s;
  });

  const recommended = routes[0];

  const fastestHadSeriousHazard = !isSafeRoute(osrmFastest);
  const wasRerouted = fastestHadSeriousHazard && recommended !== osrmFastest;

  recommended.rerouted_due_to_hazard = wasRerouted;
  recommended.avoided_hazards = wasRerouted ? osrmFastest.blockage_warnings : [];

  const noSafeAlternative = routes.every((r) => !isSafeRoute(r));
  recommended.no_safe_alternative = noSafeAlternative && fastestHadSeriousHazard;

  console.log(
    `[routing] Recommended: Route ${recommended.index} — ` +
    `safe=${isSafeRoute(recommended)}, rerouted=${wasRerouted}, ` +
    `bypass=${!!recommended.is_bypass}, no_alt=${recommended.no_safe_alternative}`
  );

  return routes;
};

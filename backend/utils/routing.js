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
 * Uses a flat-earth projection approximation — accurate enough for short segments (<10 km).
 */
const distanceToSegmentMetres = (pLat, pLng, aLat, aLng, bLat, bLng) => {
  const toRad = (d) => (d * Math.PI) / 180;

  // Scale longitude differences by cos(midLat) to get roughly equal-area units
  const midLat = toRad((aLat + bLat) / 2);
  const cosLat  = Math.cos(midLat);

  const ax = aLng * cosLat,  ay = aLat;
  const bx = bLng * cosLat,  by = bLat;
  const px = pLng * cosLat,  py = pLat;

  const dx = bx - ax,  dy = by - ay;
  const len2 = dx * dx + dy * dy;

  // Segment is a single point
  if (len2 === 0) return distanceMetres(pLat, pLng, aLat, aLng);

  // Project P onto the line, clamp to [0,1]
  let t = ((px - ax) * dx + (py - ay) * dy) / len2;
  t = Math.max(0, Math.min(1, t));

  const closestLat = aLat + t * (bLat - aLat);
  const closestLng = aLng + t * (bLng - aLng);

  return distanceMetres(pLat, pLng, closestLat, closestLng);
};

/**
 * For each active blockage, find its minimum distance to any segment of the route.
 * Returns an array of warning objects for blockages within thresholdM metres.
 */
const routePassesNearBlockage = (coordinates, blockages, thresholdM = 600) => {
  const warnings = [];

  for (const blockage of blockages) {
    const bLat = parseFloat(blockage.location_lat);
    const bLng = parseFloat(blockage.location_lng);

    // Skip if coordinates are missing / invalid
    if (!bLat || !bLng || isNaN(bLat) || isNaN(bLng)) {
      console.warn(`[routing] Blockage ${blockage.blockage_id} SKIPPED — no valid coordinates (lat=${blockage.location_lat}, lng=${blockage.location_lng})`);
      continue;
    }

    let minDist = Infinity;

    for (let i = 0; i < coordinates.length - 1; i++) {
      const [aLng, aLat] = coordinates[i];       // GeoJSON = [lng, lat]
      const [cLng, cLat] = coordinates[i + 1];

      const d = distanceToSegmentMetres(bLat, bLng, aLat, aLng, cLat, cLng);
      if (d < minDist) minDist = d;
      if (minDist <= thresholdM) break;
    }

    const hit = minDist <= thresholdM;
    console.log(
      `[routing] Blockage ${blockage.blockage_id} (${blockage.blockage_type}) ` +
      `at (${bLat.toFixed(5)}, ${bLng.toFixed(5)}) — ` +
      `min dist to route: ${Math.round(minDist)}m — ` +
      (hit ? `*** TRIGGERED (threshold ${thresholdM}m) ***` : `outside threshold (${thresholdM}m)`)
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

/**
 * Numeric severity: critical=4, high=3, medium=2, low=1, none=0
 */
const severityScore = (s) => ({ critical: 4, high: 3, medium: 2, low: 1 }[s] ?? 0);

/** Highest severity score across all blockage warnings on a route */
const maxSeverity = (route) =>
  route.blockage_warnings.reduce((m, w) => Math.max(m, severityScore(w.severity)), 0);

/**
 * A route is "safe" if it has no blockages with severity > low.
 * low-severity blockages only trigger a warning; medium/high/critical trigger rerouting.
 */
const isSafeRoute = (route) => maxSeverity(route) <= 1;

/**
 * Compute up to 2 driving routes between two points using the public OSRM API.
 * Each route is checked against active blockages.
 * Severity-aware sorting: routes with no medium/high/critical hazards are preferred.
 */
export const computeRoutes = async (pickupLat, pickupLng, destLat, destLng) => {
  const url =
    `${OSRM_BASE}/${pickupLng},${pickupLat};${destLng},${destLat}` +
    `?overview=full&geometries=geojson&alternatives=3&steps=true`;

  const response = await fetch(url);
  if (!response.ok) throw new Error(`OSRM error: ${response.status}`);

  const data = await response.json();
  if (data.code !== 'Ok' || !data.routes?.length) {
    throw new Error('No routes found between these locations');
  }

  // Fetch all active blockages once
  const blockages = await Blockage.findAll({ where: { status: 'active' } });
  console.log(`[routing] ${blockages.length} active blockage(s), ${data.routes.length} OSRM route(s)`);
  if (blockages.length > 0) {
    blockages.forEach((b) => {
      console.log(`[routing]   blockage #${b.blockage_id}: lat=${b.location_lat}, lng=${b.location_lng}, type=${b.blockage_type}, addr="${b.location_address}"`);
    });
  }

  const routes = data.routes.slice(0, 2).map((route, idx) => {
    const coordinates = route.geometry.coordinates; // [lng, lat] pairs

    // Log bounding box of this route so we can compare with blockage coords
    const lats = coordinates.map(([, lat]) => lat);
    const lngs = coordinates.map(([lng]) => lng);
    console.log(
      `[routing] Route ${idx + 1} bbox: lat [${Math.min(...lats).toFixed(5)}, ${Math.max(...lats).toFixed(5)}] ` +
      `lng [${Math.min(...lngs).toFixed(5)}, ${Math.max(...lngs).toFixed(5)}] — ${coordinates.length} points`
    );

    const warnings = routePassesNearBlockage(coordinates, blockages);

    console.log(`[routing] Route ${idx + 1}: ${(route.distance / 1000).toFixed(1)}km, ${Math.round(route.duration / 60)}min, ${warnings.length} hazard(s)`);

    return {
      index:             idx + 1,
      distance_m:        Math.round(route.distance),
      distance_km:       (route.distance / 1000).toFixed(1),
      duration_s:        Math.round(route.duration),
      duration_min:      Math.round(route.duration / 60),
      geometry:          route.geometry,
      steps:             route.legs?.[0]?.steps?.map((s) => ({
        instruction: s.maneuver?.instruction || s.name,
        distance_m:  Math.round(s.distance),
        name:        s.name,
      })) || [],
      blockage_warnings: warnings,
      has_blockages:     warnings.length > 0,
    };
  });

  // The route OSRM considers fastest (before any blockage sorting)
  const osrmFastest = routes[0];

  // Sort: safe routes first (no medium/high/critical), then by severity score, then by duration
  routes.sort((a, b) => {
    const aSafe = isSafeRoute(a);
    const bSafe = isSafeRoute(b);
    if (aSafe !== bSafe) return aSafe ? -1 : 1;          // safe always beats unsafe
    const severityDiff = maxSeverity(a) - maxSeverity(b);
    if (severityDiff !== 0) return severityDiff;           // lower severity first
    return a.duration_s - b.duration_s;                    // tie-break: faster
  });

  const recommended = routes[0];

  // Was the fastest OSRM route demoted because of a serious hazard?
  const fastestHadSeriousHazard = !isSafeRoute(osrmFastest);
  const wasRerouted = fastestHadSeriousHazard && recommended !== osrmFastest;

  recommended.rerouted_due_to_hazard = wasRerouted;
  recommended.avoided_hazards = wasRerouted ? osrmFastest.blockage_warnings : [];

  // Did every available route have a serious (>low) hazard?
  const noSafeAlternative = routes.every((r) => !isSafeRoute(r));
  recommended.no_safe_alternative = noSafeAlternative && fastestHadSeriousHazard;

  console.log(
    `[routing] Recommended: Route ${recommended.index} — ` +
    `safe=${isSafeRoute(recommended)}, rerouted=${wasRerouted}, no_alt=${recommended.no_safe_alternative}`
  );

  return routes;
};

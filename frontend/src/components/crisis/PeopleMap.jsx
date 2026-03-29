import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useWeatherOverlay } from '../../hooks/useWeatherOverlay';
import WeatherMapOverlay from './WeatherMapOverlay';

const NASHVILLE = [36.1627, -86.7816];

const RADIUS_OPTIONS = [
  { label: '1 mile',       km: 1.60934 },
  { label: '2 miles',      km: 3.21869 },
  { label: '5 miles',      km: 8.04672 },
  { label: '8 miles',      km: 12.8748 },
  { label: '15 miles',     km: 24.1402 },
  { label: 'Any distance', km: null },
];

const haversineKm = (lat1, lng1, lat2, lng2) => {
  const R    = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const personSVG = (color) => `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 56 68" width="38" height="46">
    <!-- head -->
    <circle cx="28" cy="12" r="11" fill="${color}"/>
    <!-- body: rounded shoulders tapering to legs -->
    <path d="M14,27 C14,24 16,23 19,23 L37,23 C40,23 42,24 42,27 L42,50 L33,50 L33,60 L23,60 L23,50 L14,50 Z"
          fill="${color}"/>
    <!-- location ring at feet -->
    <ellipse cx="28" cy="61" rx="22" ry="7"
             fill="none" stroke="${color}" stroke-width="4.5"/>
  </svg>
`;

const makePersonIcon = (color) =>
  L.divIcon({
    className:   '',
    html:        `<div style="filter:drop-shadow(0 2px 4px rgba(0,0,0,0.30))">${personSVG(color)}</div>`,
    iconSize:    [38, 46],
    iconAnchor:  [19, 61],   // anchor at the base of the ring
    popupAnchor: [0, -50],
  });

// mode = 'volunteer'  → showing people IN NEED  (blue)
// mode = 'need-help'  → showing VOLUNTEERS       (green)
const ICONS = {
  'volunteer': makePersonIcon('#3b82f6'),
  'need-help': makePersonIcon('#16a34a'),
};

/**
 * Props:
 *   people       – array of offer/request objects with a .user that has location_lat/lng
 *   mode         – 'volunteer' | 'need-help'
 *   userLat      – current user's lat
 *   userLng      – current user's lng
 *   radiusKm     – selected radius (km), null = any
 *   radiusLabel  – display label for the radius
 *   onUserClick  – optional (userId: string, userName: string) => void
 */
const PeopleMap = ({ people, mode, userLat, userLng, radiusKm, radiusLabel, onUserClick, contextLabel = null }) => {
  const mapRef        = useRef(null);
  const leafletRef    = useRef(null);
  const radiusCircle  = useRef(null);
  const impactZoneRef = useRef(null);
  const markerRefs    = useRef([]);
  const onUserClickRef = useRef(onUserClick);
  const { weatherSummary, overlayStyle, showImpactZone } = useWeatherOverlay({
    location_lat: userLat,
    location_lng: userLng,
  });

  useEffect(() => { onUserClickRef.current = onUserClick; }, [onUserClick]);

  const lat = userLat ?? NASHVILLE[0];
  const lng = userLng ?? NASHVILLE[1];

  // ── Init map once ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || leafletRef.current) return;

    const map = L.map(mapRef.current, { scrollWheelZoom: true }).setView([lat, lng], 12);
    leafletRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    // Blue dot — current user
    L.circleMarker([lat, lng], {
      radius: 11, color: '#1e40af', weight: 3, fillColor: '#3b82f6', fillOpacity: 1,
    })
      .addTo(map)
      .bindPopup('<p style="font-weight:700;margin:0">Your location</p>');

    // Global callback used by popup buttons (Leaflet popup HTML can't call React fns directly)
    window.__peopleMapUserClick = (userId, userName) => {
      onUserClickRef.current?.(userId, userName);
    };

    return () => {
      map.remove();
      leafletRef.current   = null;
      radiusCircle.current = null;
      impactZoneRef.current = null;
      markerRefs.current   = [];
      delete window.__peopleMapUserClick;
    };
  }, []);

  // ── Update radius circle when radiusKm changes ───────────────────────────
  useEffect(() => {
    const map = leafletRef.current;
    if (!map) return;

    if (radiusCircle.current) {
      radiusCircle.current.remove();
      radiusCircle.current = null;
    }

    if (radiusKm !== null) {
      radiusCircle.current = L.circle([lat, lng], {
        radius:      radiusKm * 1000,  // metres
        color:       '#3b82f6',
        weight:      2,
        dashArray:   '6 6',
        fillColor:   '#3b82f6',
        fillOpacity: 0.06,
      }).addTo(map);
    }
  }, [radiusKm]);

  useEffect(() => {
    const map = leafletRef.current;
    if (!map) return;

    if (impactZoneRef.current) {
      impactZoneRef.current.remove();
      impactZoneRef.current = null;
    }

    if (showImpactZone) {
      impactZoneRef.current = L.circle([lat, lng], {
        radius: 10000,
        color: overlayStyle.borderColor,
        weight: 2,
        dashArray: '8 8',
        fillColor: overlayStyle.fillColor,
        fillOpacity: overlayStyle.fillOpacity,
      }).addTo(map);
    }
  }, [lat, lng, overlayStyle.borderColor, overlayStyle.fillColor, overlayStyle.fillOpacity, showImpactZone]);

  // ── Update people markers when list changes ──────────────────────────────
  useEffect(() => {
    const map = leafletRef.current;
    if (!map) return;

    // Clear previous markers
    markerRefs.current.forEach((m) => m.remove());
    markerRefs.current = [];

    const icon = ICONS[mode] || ICONS['volunteer'];

    people.forEach((item) => {
      const u = item.user;
      if (!u?.location_lat || !u?.location_lng) return;

      const pLat = parseFloat(u.location_lat);
      const pLng = parseFloat(u.location_lng);

      const name    = u.name || 'Unknown';
      const title   = item.title || '';
      const address = u.location_address || '';

      const safeUserId = String(u.user_id).replace(/'/g, '');
      const safeName   = name.replace(/'/g, '&#39;').replace(/"/g, '&quot;');

      const marker = L.marker([pLat, pLng], { icon })
        .addTo(map)
        .bindPopup(
          `<div style="min-width:160px">
            <p style="font-weight:700;margin:0 0 3px">${name}</p>
            ${title ? `<p style="font-size:12px;color:#374151;margin:0 0 3px">${title}</p>` : ''}
            ${address ? `<p style="font-size:11px;color:#6b7280;margin:0 0 8px">${address}</p>` : ''}
            <button
              onclick="window.__peopleMapUserClick('${safeUserId}','${safeName}')"
              style="margin-top:4px;padding:5px 12px;background:#3b82f6;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;width:100%"
            >View Posts →</button>
          </div>`
        );

      markerRefs.current.push(marker);
    });
  }, [people, mode]);

  return (
    <div
      className="w-full rounded-2xl overflow-hidden shadow-lg border border-gray-200 relative"
      style={{ height: 400 }}
    >
      <WeatherMapOverlay
        weatherSummary={weatherSummary}
        overlayStyle={overlayStyle}
        contextLabel={contextLabel}
      />
      <div ref={mapRef} style={{ height: '100%', width: '100%' }} />
    </div>
  );
};

export { RADIUS_OPTIONS, haversineKm };
export default PeopleMap;

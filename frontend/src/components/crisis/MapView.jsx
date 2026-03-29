import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAuth } from '../../contexts/AuthContext';
import { getBlockages } from '../../services/blockageService';
import { useWeatherOverlay } from '../../hooks/useWeatherOverlay';
import WeatherMapOverlay from './WeatherMapOverlay';

const NASHVILLE = [36.1627, -86.7816];

const SEVERITY_COLOR = {
  critical: '#7f1d1d',
  high:     '#dc2626',
  medium:   '#f97316',
  low:      '#16a34a',
};

const TYPE_ICON = {
  tree_down:    'Tree',
  flooding:     'Flood',
  ice:          'Ice',
  power_line:   'Power',
  debris:       'Debris',
  road_closure: 'Closure',
  accident:     'Accident',
  other:        'Hazard',
};

const makeMedicalIcon = (emoji, borderColor) =>
  L.divIcon({
    className: '',
    html: `<div style="background:#fff;border:2.5px solid ${borderColor};border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:17px;box-shadow:0 2px 8px rgba(0,0,0,0.28)">${emoji}</div>`,
    iconSize:    [32, 32],
    iconAnchor:  [16, 16],
    popupAnchor: [0, -20],
  });

const fetchMedicalFacilities = async (map) => {
  try {
    // Call our own backend proxy — avoids browser CORS issues with Overpass
    const res  = await fetch('/api/medical-facilities');
    if (!res.ok) throw new Error(`API ${res.status}`);
    const { data } = await res.json();

    const hospitalIcon   = makeMedicalIcon('🏥', '#dc2626');
    const urgentCareIcon = makeMedicalIcon('🩺', '#ea580c');

    data.forEach((facility) => {
      const isHosp = facility.type === 'hospital';
      L.marker([facility.lat, facility.lng], { icon: isHosp ? hospitalIcon : urgentCareIcon })
        .addTo(map)
        .bindPopup(
          `<div style="min-width:160px">
            <p style="font-weight:700;margin:0 0 3px">${isHosp ? '🏥' : '🩺'} ${facility.name}</p>
            <p style="font-size:12px;color:#6b7280;margin:0 0 3px">${isHosp ? 'Hospital' : 'Urgent Care / Clinic'}</p>
            ${facility.phone ? `<p style="font-size:12px;margin:0">Phone: ${facility.phone}</p>` : ''}
          </div>`
        );
    });
  } catch (err) {
    console.error('Medical facilities error:', err.message);
  }
};

const MapView = ({ contextLabel = null }) => {
  const { user } = useAuth();
  const mapRef        = useRef(null);
  const leafletRef    = useRef(null);
  const blockageLayer = useRef({});
  const impactZoneRef = useRef(null);
  const pollTimer     = useRef(null);
  const [loading, setLoading] = useState(true);
  const { weatherSummary, overlayStyle, showImpactZone } = useWeatherOverlay(user);

  const userLat = user?.location_lat ? parseFloat(user.location_lat) : NASHVILLE[0];
  const userLng = user?.location_lng ? parseFloat(user.location_lng) : NASHVILLE[1];

  const syncBlockages = async (map) => {
    try {
      const data      = await getBlockages({ status: 'active' });
      const active    = data.blockages || [];
      const activeIds = new Set(active.map((b) => String(b.blockage_id)));

      Object.keys(blockageLayer.current).forEach((id) => {
        if (!activeIds.has(id)) {
          blockageLayer.current[id].remove();
          delete blockageLayer.current[id];
        }
      });

      active.forEach((b) => {
        if (!b.location_lat || !b.location_lng) return;
        const id = String(b.blockage_id);
        if (blockageLayer.current[id]) return;

        const color = SEVERITY_COLOR[b.severity] || '#6b7280';
        const icon  = TYPE_ICON[b.blockage_type] || 'Hazard';

        const marker = L.circleMarker(
          [parseFloat(b.location_lat), parseFloat(b.location_lng)],
          { radius: 10, color: '#fff', weight: 2, fillColor: color, fillOpacity: 0.95 }
        )
          .addTo(map)
          .bindPopup(
            `<div style="min-width:160px">
              <p style="font-weight:700;margin:0 0 4px">${icon} ${(b.blockage_type || '').replace(/_/g, ' ')}</p>
              <p style="color:${color};font-weight:600;text-transform:capitalize;margin:0 0 4px">${b.severity} severity</p>
              ${b.location_address ? `<p style="font-size:11px;color:#6b7280;margin:0 0 4px">${b.location_address}</p>` : ''}
              ${b.description ? `<p style="font-size:12px;margin:4px 0 0">${b.description}</p>` : ''}
              <p style="font-size:11px;color:#9ca3af;margin:4px 0 0">Reported by ${b.reporter?.name || 'unknown'}</p>
            </div>`
          );

        blockageLayer.current[id] = marker;
      });
    } catch {
      // silently ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!mapRef.current || leafletRef.current) return;

    const map = L.map(mapRef.current, { scrollWheelZoom: true }).setView([userLat, userLng], 11);
    leafletRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    // Blue dot — user location
    L.circleMarker([userLat, userLng], {
      radius: 11, color: '#1e40af', weight: 3, fillColor: '#3b82f6', fillOpacity: 1,
    })
      .addTo(map)
      .bindPopup(
        `<p style="font-weight:700;margin:0">Your location</p>${
          user?.location_address
            ? `<p style="font-size:12px;color:#6b7280;margin:4px 0 0">${user.location_address}</p>`
            : ''
        }`
      );

    // Permanent medical facility markers (never removed)
    fetchMedicalFacilities(map);

    // Blockages — initial load + poll every 30 s
    syncBlockages(map);
    pollTimer.current = setInterval(() => syncBlockages(map), 30_000);

    return () => {
      clearInterval(pollTimer.current);
      map.remove();
      leafletRef.current    = null;
      blockageLayer.current = {};
      impactZoneRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = leafletRef.current;
    if (!map) return;

    if (impactZoneRef.current) {
      impactZoneRef.current.remove();
      impactZoneRef.current = null;
    }

    if (showImpactZone) {
      impactZoneRef.current = L.circle([userLat, userLng], {
        radius: 12000,
        color: overlayStyle.borderColor,
        weight: 2,
        dashArray: '8 8',
        fillColor: overlayStyle.fillColor,
        fillOpacity: overlayStyle.fillOpacity,
      }).addTo(map);
    }
  }, [showImpactZone, overlayStyle.borderColor, overlayStyle.fillColor, overlayStyle.fillOpacity, userLat, userLng]);

  return (
    <div className="w-full rounded-2xl overflow-hidden shadow-xl border border-gray-200 relative h-64 md:h-[520px] lg:h-[600px]">
      <WeatherMapOverlay
        weatherSummary={weatherSummary}
        overlayStyle={overlayStyle}
        contextLabel={contextLabel}
      />
      <div ref={mapRef} style={{ height: '100%', width: '100%' }} />

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-60 rounded-2xl">
          <p className="text-gray-500 text-sm">Loading map…</p>
        </div>
      )}
    </div>
  );
};

export default MapView;

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import BlockageCard from './BlockageCard';
import { getBlockages } from '../../services/blockageService';

const STORAGE_KEY = 'blockage_list_radius_km';

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

const TYPES = ['', 'tree_down', 'flooding', 'ice', 'power_line', 'debris', 'road_closure', 'accident', 'other'];
const SEVERITIES = ['', 'low', 'medium', 'high', 'critical'];
const STATUSES = ['', 'active', 'resolved', 'verified'];
const RADIUS_OPTIONS = [
  { label: '1 mile', value: 1.60934 },
  { label: '2 miles', value: 3.21869 },
  { label: '5 miles', value: 8.04672 },
  { label: '8 miles', value: 12.8748 },
  { label: '15 miles', value: 24.1402 },
  { label: 'Any distance', value: null },
];

const BlockageList = () => {
  const { user } = useAuth();
  const [blockages, setBlockages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(() => {
    const storedRadius = window.localStorage.getItem(STORAGE_KEY);
    const parsedRadius = storedRadius === null
      ? 1.60934
      : storedRadius === 'any'
        ? null
        : parseFloat(storedRadius);

    return {
      blockage_type: '',
      severity: '',
      status: '',
      radiusKm: Number.isNaN(parsedRadius) ? 1.60934 : parsedRadius,
    };
  });

  useEffect(() => {
    window.localStorage.setItem(
      STORAGE_KEY,
      filters.radiusKm == null ? 'any' : String(filters.radiusKm)
    );
  }, [filters.radiusKm]);

  const fetchBlockages = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (filters.blockage_type) params.blockage_type = filters.blockage_type;
      if (filters.severity) params.severity = filters.severity;
      if (filters.status) params.status = filters.status;
      const data = await getBlockages(params);

      const all = data.blockages || [];
      const userLat = user?.location_lat ? parseFloat(user.location_lat) : null;
      const userLng = user?.location_lng ? parseFloat(user.location_lng) : null;
      const radiusKm = filters.radiusKm;

      const visible = all.filter((b) => {
        if (b.reporter?.user_id === user?.user_id) return true; // always show own reports

        // If "Any distance" selected, show everything
        if (radiusKm === null) return true;

        // Filter by distance from user's location to blockage location
        if (!userLat || !userLng) return false;
        const bLat = b.location_lat ? parseFloat(b.location_lat) : null;
        const bLng = b.location_lng ? parseFloat(b.location_lng) : null;
        if (!bLat || !bLng) return false;
        return haversineKm(userLat, userLng, bLat, bLng) <= radiusKm;
      });

      setBlockages(visible);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlockages();
  }, [filters]);

  return (
    <div>
      {/* Filter bar */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select
          className="input-field w-auto"
          value={filters.blockage_type}
          onChange={(e) => setFilters((f) => ({ ...f, blockage_type: e.target.value }))}
        >
          <option value="">All Types</option>
          {TYPES.slice(1).map((t) => (
            <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
          ))}
        </select>

        <select
          className="input-field w-auto"
          value={filters.severity}
          onChange={(e) => setFilters((f) => ({ ...f, severity: e.target.value }))}
        >
          <option value="">All Severities</option>
          {SEVERITIES.slice(1).map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <select
          className="input-field w-auto"
          value={filters.status}
          onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
        >
          <option value="">All Statuses</option>
          {STATUSES.slice(1).map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <select
          className="input-field w-auto"
          value={filters.radiusKm ?? ''}
          onChange={(e) => setFilters((f) => ({
            ...f,
            radiusKm: e.target.value === '' ? null : parseFloat(e.target.value)
          }))}
        >
          {RADIUS_OPTIONS.map((r) => (
            <option key={r.label} value={r.value ?? ''}>{r.label}</option>
          ))}
        </select>
      </div>

      {loading && <p className="text-gray-500">Loading blockages...</p>}
      {error && <p className="text-red-600">Error: {error}</p>}

      {!loading && !error && blockages.length === 0 && (
        <p className="text-gray-500 text-center py-8">No blockages reported yet.</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {blockages.map((b) => (
          <BlockageCard key={b.blockage_id} blockage={b} onUpdate={fetchBlockages} />
        ))}
      </div>
    </div>
  );
};

export default BlockageList;

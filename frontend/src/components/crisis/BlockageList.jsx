import React, { useEffect, useState } from 'react';
import BlockageCard from './BlockageCard';
import { getBlockages } from '../../services/blockageService';

const TYPES = ['', 'tree_down', 'flooding', 'ice', 'power_line', 'debris', 'road_closure', 'other'];
const SEVERITIES = ['', 'low', 'medium', 'high', 'critical'];
const STATUSES = ['', 'active', 'resolved', 'verified'];

const BlockageList = () => {
  const [blockages, setBlockages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ blockage_type: '', severity: '', status: '' });

  const fetchBlockages = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (filters.blockage_type) params.blockage_type = filters.blockage_type;
      if (filters.severity) params.severity = filters.severity;
      if (filters.status) params.status = filters.status;
      const data = await getBlockages(params);
      setBlockages(data.blockages || []);
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

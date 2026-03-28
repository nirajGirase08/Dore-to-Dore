import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { updateBlockage } from '../../services/blockageService';

const SEVERITY_STYLES = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
};

const TYPE_ICONS = {
  accident: '🚨',
  tree_down: '🌳',
  flooding: '🌊',
  ice: '🧊',
  power_line: '⚡',
  debris: '🪨',
  road_closure: '🚧',
  other: '⚠️',
};

const formatTimeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

const BlockageCard = ({ blockage, onUpdate }) => {
  const { user } = useAuth();
  const isOwner = user && blockage.reported_by === user.user_id;

  const handleMarkResolved = async () => {
    try {
      await updateBlockage(blockage.blockage_id, { status: 'resolved' });
      if (onUpdate) onUpdate();
    } catch (err) {
      alert('Failed to update blockage: ' + err.message);
    }
  };

  return (
    <div className="card flex flex-col gap-3">
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{TYPE_ICONS[blockage.blockage_type] || '⚠️'}</span>
          <div>
            <p className="font-semibold text-gray-800 capitalize">
              {blockage.blockage_type?.replace(/_/g, ' ')}
            </p>
            <p className="text-xs text-gray-500">{formatTimeAgo(blockage.created_at)}</p>
          </div>
        </div>
        <span
          className={`badge capitalize ${SEVERITY_STYLES[blockage.severity] || 'bg-gray-100 text-gray-800'}`}
        >
          {blockage.severity}
        </span>
      </div>

      {/* Location */}
      {blockage.location_address && (
        <p className="text-sm text-gray-600 flex items-center gap-1">
          <span>📍</span> {blockage.location_address}
        </p>
      )}

      {/* Description */}
      {blockage.description && (
        <p className="text-sm text-gray-700">{blockage.description}</p>
      )}

      {/* Badges row */}
      <div className="flex flex-wrap gap-2">
        <span
          className={`badge text-xs ${
            blockage.status === 'resolved'
              ? 'bg-gray-100 text-gray-600'
              : 'bg-blue-100 text-blue-800'
          }`}
        >
          {blockage.status}
        </span>
        {isOwner && blockage.authority_notified && (
          <span className="badge text-xs bg-green-100 text-green-800">
            ✓ Authorities Notified
          </span>
        )}
        {blockage.reporter?.name && (
          <span className="text-xs text-gray-500">
            Reported by {blockage.reporter.name}
          </span>
        )}
      </div>

      {/* Actions */}
      {isOwner && blockage.status !== 'resolved' && (
        <button
          onClick={handleMarkResolved}
          className="btn-secondary text-sm py-2 px-4 self-start"
        >
          Mark Resolved
        </button>
      )}
    </div>
  );
};

export default BlockageCard;

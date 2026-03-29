import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { updateBlockage } from '../../services/blockageService';

const SEVERITY_STYLES = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
};

const TYPE_ICONS = {
  accident: 'Accident',
  tree_down: 'Tree',
  flooding: 'Flood',
  ice: 'Ice',
  power_line: 'Power',
  debris: 'Debris',
  road_closure: 'Closure',
  other: 'Hazard',
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
  const [modalOpen, setModalOpen] = useState(false);

  const handleMarkResolved = async (e) => {
    e.stopPropagation();
    try {
      await updateBlockage(blockage.blockage_id, { status: 'resolved' });
      if (onUpdate) onUpdate();
    } catch (err) {
      alert('Failed to update blockage: ' + err.message);
    }
  };

  return (
    <>
      {/* Card */}
      <div
        className="card flex flex-col gap-3 cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => setModalOpen(true)}
      >
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex min-w-16 justify-center rounded-full bg-[#f0e8da] px-2 py-1 text-xs font-semibold text-[#6c5b20]">{TYPE_ICONS[blockage.blockage_type] || 'Hazard'}</span>
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
            <span>Location:</span> {blockage.location_address}
          </p>
        )}

        {/* Description — truncated on card */}
        {blockage.description && (
          <p className="text-sm text-gray-700 line-clamp-2">{blockage.description}</p>
        )}

        {/* Photo thumbnail */}
        {blockage.photo_url && (
          <img
            src={blockage.photo_url}
            alt="Blockage photo"
            className="rounded-lg max-h-32 w-full object-cover border border-gray-200"
          />
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
          {blockage.photo_url && (
            <span className="text-xs text-blue-500 ml-auto">Photo</span>
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

      {/* Detail Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <span className="inline-flex min-w-20 justify-center rounded-full bg-[#f0e8da] px-2 py-1 text-xs font-semibold text-[#6c5b20]">{TYPE_ICONS[blockage.blockage_type] || 'Hazard'}</span>
                <div>
                  <h2 className="text-lg font-bold text-gray-800 capitalize">
                    {blockage.blockage_type?.replace(/_/g, ' ')}
                  </h2>
                  <p className="text-xs text-gray-500">{formatTimeAgo(blockage.created_at)}</p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 text-2xl leading-none"
              >
                ✕
              </button>
            </div>

            {/* Modal body */}
            <div className="px-6 py-5 flex flex-col gap-4">
              {/* Severity + status */}
              <div className="flex flex-wrap gap-2">
                <span className={`badge capitalize ${SEVERITY_STYLES[blockage.severity] || 'bg-gray-100 text-gray-800'}`}>
                  {blockage.severity} severity
                </span>
                <span className={`badge text-xs ${blockage.status === 'resolved' ? 'bg-gray-100 text-gray-600' : 'bg-blue-100 text-blue-800'}`}>
                  {blockage.status}
                </span>
                {blockage.authority_notified && (
                  <span className="badge text-xs bg-green-100 text-green-800">✓ Authorities Notified</span>
                )}
              </div>

              {/* Location */}
              {blockage.location_address && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Location</p>
                  <p className="text-sm text-gray-700">{blockage.location_address}</p>
                </div>
              )}

              {/* Description */}
              {blockage.description && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Description</p>
                  <p className="text-sm text-gray-700">{blockage.description}</p>
                </div>
              )}

              {/* Full-size photo */}
              {blockage.photo_url && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Photo</p>
                  <a href={blockage.photo_url} target="_blank" rel="noopener noreferrer">
                    <img
                      src={blockage.photo_url}
                      alt="Blockage photo"
                      className="rounded-xl w-full object-contain border border-gray-200 hover:opacity-90 transition-opacity"
                    />
                    <p className="text-xs text-center text-blue-500 mt-1">Click to open full size</p>
                  </a>
                </div>
              )}

              {/* Reporter */}
              {blockage.reporter?.name && (
                <p className="text-xs text-gray-500">Reported by {blockage.reporter.name}</p>
              )}

              {/* Owner action */}
              {isOwner && blockage.status !== 'resolved' && (
                <button
                  onClick={(e) => { handleMarkResolved(e); setModalOpen(false); }}
                  className="btn-secondary text-sm py-2 px-4 self-start"
                >
                  Mark Resolved
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BlockageCard;

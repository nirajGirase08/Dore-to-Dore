import express from 'express';
import Blockage from '../models/Blockage.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { geocodeAddress } from '../services/geocodingService.js';

const router = express.Router();

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

/**
 * Dispatch in-app notifications after a blockage is created.
 * high/critical → notify ALL users (shown as full-width banner)
 * low/medium    → notify users within 1 mile who have location set (shown in bell)
 * Called with setImmediate so it never blocks the API response.
 */
const dispatchBlockageNotifications = async (blockage) => {
  try {
    const { severity, blockage_type, location_lat, location_lng, location_address, blockage_id, reported_by } = blockage;
    const isHighSeverity = ['high', 'critical'].includes(severity);

    const typeLabel = blockage_type.replace(/_/g, ' ');
    const locLabel = location_address
      || (location_lat ? `${parseFloat(location_lat).toFixed(4)}, ${parseFloat(location_lng).toFixed(4)}` : 'unknown location');

    const title = severity === 'critical'
      ? `⚠️ Critical Blockage: ${typeLabel}`
      : severity === 'high'
      ? `🚨 High-Severity Blockage: ${typeLabel}`
      : `🚧 Nearby Blockage: ${typeLabel}`;

    const message = `${typeLabel.charAt(0).toUpperCase() + typeLabel.slice(1)} reported at ${locLabel}. Severity: ${severity}.`;
    const notification_type = isHighSeverity ? 'blockage_alert' : 'blockage_nearby';

    const allUsers = await User.findAll({ attributes: ['user_id', 'location_lat', 'location_lng'] });

    let targetUsers;
    if (isHighSeverity) {
      targetUsers = allUsers.filter((u) => u.user_id !== reported_by);
    } else {
      // Use the reporter's stored profile location as the notification epicenter.
      // Browser GPS on desktops gives IP-based coords that can be far off campus,
      // so we always anchor the 1-mile radius to the reporter's known profile location.
      // The blockage's own lat/lng is still stored and shown on the map.
      if (!reported_by) return;

      const reporter = await User.findByPk(reported_by, {
        attributes: ['location_lat', 'location_lng'],
      });

      if (!reporter?.location_lat || !reporter?.location_lng) return;

      const bLat = parseFloat(reporter.location_lat);
      const bLng = parseFloat(reporter.location_lng);

      targetUsers = allUsers.filter((u) => {
        if (u.user_id === reported_by) return false; // don't notify the reporter
        if (!u.location_lat || !u.location_lng) return false;
        return haversineKm(bLat, bLng, parseFloat(u.location_lat), parseFloat(u.location_lng)) <= 1.60934;
      });
    }

    if (!targetUsers.length) return;

    await Notification.bulkCreate(
      targetUsers.map((u) => ({
        user_id: u.user_id,
        notification_type,
        title,
        message,
        related_id: blockage_id,
        severity,
      }))
    );

    console.log(`[Notifications] Dispatched ${targetUsers.length} for blockage #${blockage_id} (${severity})`);
  } catch (err) {
    console.error('[Notifications] Dispatch error:', err.message);
  }
};

// ─── POST /api/blockages ──────────────────────────────────────────────────────
// Create a new blockage report (requires auth)
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      blockage_type,
      severity,
      description,
      location_address,
      location_lat,
      location_lng,
      expires_at,
    } = req.body;

    let lat = location_lat != null ? parseFloat(location_lat) : null;
    let lng = location_lng != null ? parseFloat(location_lng) : null;
    let address = location_address || null;

    // Geocode if address provided but no coords
    if (address && lat == null && lng == null) {
      const geocoded = await geocodeAddress(address);
      if (geocoded) {
        lat = geocoded.lat;
        lng = geocoded.lng;
        address = geocoded.formatted_address;
      }
    }

    const blockage = await Blockage.create({
      reported_by: req.userId,
      blockage_type,
      severity,
      description,
      location_lat: lat,
      location_lng: lng,
      location_address: address,
      updated_at: new Date(),
      expires_at: expires_at || null,
    });

    // Dispatch in-app notifications without blocking the response
    setImmediate(() => dispatchBlockageNotifications(blockage).catch(console.error));

    res.status(201).json({ success: true, blockage });
  } catch (err) {
    console.error('Create blockage error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── GET /api/blockages ───────────────────────────────────────────────────────
// List blockages with optional filters: lat, lng, radius (km), status, blockage_type, severity
router.get('/', async (req, res) => {
  try {
    const { lat, lng, radius, status, blockage_type, severity } = req.query;

    const where = {};
    if (status) where.status = status;
    if (blockage_type) where.blockage_type = blockage_type;
    if (severity) where.severity = severity;

    const blockages = await Blockage.findAll({
      where,
      include: [{ model: User, as: 'reporter', attributes: ['user_id', 'name', 'location_lat', 'location_lng'] }],
      order: [['created_at', 'DESC']],
    });

    // Client-side radius filter using Haversine formula
    let result = blockages;
    if (lat && lng && radius) {
      const R = 6371;
      const uLat = parseFloat(lat);
      const uLng = parseFloat(lng);
      const r = parseFloat(radius);
      result = blockages.filter((b) => {
        if (b.location_lat == null || b.location_lng == null) return true;
        const dLat = ((parseFloat(b.location_lat) - uLat) * Math.PI) / 180;
        const dLng = ((parseFloat(b.location_lng) - uLng) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) ** 2 +
          Math.cos((uLat * Math.PI) / 180) *
            Math.cos((parseFloat(b.location_lat) * Math.PI) / 180) *
            Math.sin(dLng / 2) ** 2;
        const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return dist <= r;
      });
    }

    res.json({ success: true, blockages: result });
  } catch (err) {
    console.error('Get blockages error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── GET /api/blockages/:id ───────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const blockage = await Blockage.findByPk(req.params.id, {
      include: [{ model: User, as: 'reporter', attributes: ['user_id', 'name'] }],
    });
    if (!blockage) {
      return res.status(404).json({ success: false, error: 'Blockage not found' });
    }
    res.json({ success: true, blockage });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── PUT /api/blockages/:id ───────────────────────────────────────────────────
// Update status/description (creator only)
router.put('/:id', authenticate, async (req, res) => {
  try {
    const blockage = await Blockage.findByPk(req.params.id);
    if (!blockage) {
      return res.status(404).json({ success: false, error: 'Blockage not found' });
    }
    if (blockage.reported_by !== req.userId) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }
    const { status, description } = req.body;
    await blockage.update({ status, description, updated_at: new Date() });
    res.json({ success: true, blockage });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── DELETE /api/blockages/:id ────────────────────────────────────────────────
// Delete (creator only)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const blockage = await Blockage.findByPk(req.params.id);
    if (!blockage) {
      return res.status(404).json({ success: false, error: 'Blockage not found' });
    }
    if (blockage.reported_by !== req.userId) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }
    await blockage.destroy();
    res.json({ success: true, message: 'Blockage deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── POST /api/blockages/:id/notify ──────────────────────────────────────────
// Re-dispatch in-app notifications for an existing blockage
router.post('/:id/notify', authenticate, async (req, res) => {
  try {
    const blockage = await Blockage.findByPk(req.params.id);
    if (!blockage) {
      return res.status(404).json({ success: false, error: 'Blockage not found' });
    }
    setImmediate(() => dispatchBlockageNotifications(blockage).catch(console.error));
    res.json({ success: true, message: 'Notifications dispatched' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;

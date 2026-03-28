import express from 'express';
import Blockage from '../models/Blockage.js';
import User from '../models/User.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { geocodeAddress } from '../services/geocodingService.js';

const router = express.Router();

/**
 * Stub: notify authorities about a blockage.
 * TODO: Replace with real email/SMS integration (e.g. SendGrid, Twilio).
 */
const sendBlockageNotification = async (blockage) => {
  const loc = blockage.location_address
    || `${blockage.location_lat}, ${blockage.location_lng}`;
  console.log(
    `[AUTHORITY NOTIFY] Blockage #${blockage.blockage_id} — type: ${blockage.blockage_type}, ` +
    `severity: ${blockage.severity}, location: ${loc}`
  );
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
      notify_authorities,
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
      authority_notified: false,
      updated_at: new Date(),
      expires_at: expires_at || null,
    });

    let authority_notified = false;
    if (notify_authorities) {
      await sendBlockageNotification(blockage);
      await blockage.update({ authority_notified: true, notified_at: new Date() });
      authority_notified = true;
    }

    res.status(201).json({ success: true, blockage, authority_notified });
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
      include: [{ model: User, as: 'reporter', attributes: ['user_id', 'name'] }],
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
// Trigger authority notification if not already sent
router.post('/:id/notify', authenticate, async (req, res) => {
  try {
    const blockage = await Blockage.findByPk(req.params.id);
    if (!blockage) {
      return res.status(404).json({ success: false, error: 'Blockage not found' });
    }
    if (blockage.authority_notified) {
      return res.json({ success: true, message: 'Authorities already notified', blockage });
    }
    await sendBlockageNotification(blockage);
    await blockage.update({ authority_notified: true, notified_at: new Date() });
    res.json({ success: true, message: 'Authorities notified', blockage });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;

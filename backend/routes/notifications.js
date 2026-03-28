import express from 'express';
import Notification from '../models/Notification.js';
import Blockage from '../models/Blockage.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/notifications — unread notifications for logged-in user
// Automatically excludes notifications whose related blockage is already resolved
router.get('/', authenticate, async (req, res) => {
  try {
    const { is_read, notification_type } = req.query;

    const where = { user_id: req.userId };
    if (is_read !== undefined) where.is_read = is_read === 'true';
    if (notification_type) where.notification_type = notification_type;

    const notifications = await Notification.findAll({
      where,
      include: [{
        model: Blockage,
        as: 'relatedBlockage',
        attributes: ['status'],
        required: false,
      }],
      order: [['created_at', 'DESC']],
      limit: 50,
    });

    // Drop notifications whose blockage has been resolved
    const filtered = notifications.filter(
      (n) => !n.relatedBlockage || n.relatedBlockage.status !== 'resolved'
    );

    res.json({ success: true, notifications: filtered });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/notifications/:id/read — mark one as read
router.put('/:id/read', authenticate, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      where: { notification_id: req.params.id, user_id: req.userId },
    });
    if (!notification) {
      return res.status(404).json({ success: false, error: 'Notification not found' });
    }
    await notification.update({ is_read: true, is_dismissed: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/notifications/read-all — mark all as read for current user
router.put('/read-all', authenticate, async (req, res) => {
  try {
    await Notification.update(
      { is_read: true, is_dismissed: true },
      { where: { user_id: req.userId, is_read: false } }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;

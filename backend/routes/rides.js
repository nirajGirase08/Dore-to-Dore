import express from 'express';
import { Op, literal } from 'sequelize';
import { authenticate } from '../middleware/authMiddleware.js';
import { RideRequest, User } from '../models/index.js';
import Notification from '../models/Notification.js';
import { computeRoutes } from '../utils/routing.js';

const router = express.Router();

const RIDER_ATTRS = ['user_id', 'name', 'phone', 'profile_image_url', 'location_lat', 'location_lng', 'location_address'];

// Broadcast a ride_request notification to all users except the requester
const broadcastRideNotification = async (rideRequest, requesterName) => {
  try {
    const allUsers = await User.findAll({
      where: { user_id: { [Op.ne]: rideRequest.requester_id } },
      attributes: ['user_id'],
    });

    const urgencyLabel = rideRequest.urgency === 'emergency' ? '🚨 EMERGENCY' :
                         rideRequest.urgency === 'urgent'    ? '⚡ Urgent'    : 'Ride';

    await Notification.bulkCreate(
      allUsers.map((u) => ({
        user_id:           u.user_id,
        notification_type: 'ride_request',
        title:             `${urgencyLabel} Ride Needed`,
        message:           `${requesterName} needs a ride from ${rideRequest.pickup_address || 'their location'} to ${rideRequest.destination_address || 'their destination'}.`,
        related_id:        rideRequest.ride_request_id,
        severity:          rideRequest.urgency === 'emergency' ? 'critical' : 'high',
        is_read:           false,
      }))
    );
  } catch (err) {
    console.error('Failed to broadcast ride notification:', err);
  }
};

// POST /api/rides — create ride request
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      pickup_lat, pickup_lng, pickup_address,
      destination_lat, destination_lng, destination_address,
      urgency, notes,
    } = req.body;

    if (!pickup_lat || !pickup_lng || !destination_lat || !destination_lng) {
      return res.status(400).json({ success: false, error: 'Pickup and destination coordinates are required.' });
    }

    const ride = await RideRequest.create({
      requester_id: req.userId,
      pickup_lat, pickup_lng, pickup_address,
      destination_lat, destination_lng, destination_address,
      urgency: urgency || 'urgent',
      notes,
      status: 'pending',
    });

    const requester = await User.findByPk(req.userId, { attributes: ['name'] });
    await broadcastRideNotification(ride, requester?.name || 'Someone');

    res.status(201).json({ success: true, data: ride });
  } catch (err) {
    console.error('Create ride error:', err);
    res.status(500).json({ success: false, error: 'Failed to create ride request.' });
  }
});

// GET /api/rides/available — pending rides for volunteers
router.get('/available', authenticate, async (req, res) => {
  try {
    const rides = await RideRequest.findAll({
      where: { status: 'pending', requester_id: { [Op.ne]: req.userId } },
      include: [{ model: User, as: 'requester', attributes: RIDER_ATTRS }],
      order: [
        [literal(`CASE WHEN urgency = 'emergency' THEN 0 WHEN urgency = 'urgent' THEN 1 ELSE 2 END`), 'ASC'],
        ['created_at', 'ASC'],
      ],
    });
    res.json({ success: true, data: rides });
  } catch (err) {
    console.error('Get available rides error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch available rides.' });
  }
});

// GET /api/rides/my — requester's own rides
router.get('/my', authenticate, async (req, res) => {
  try {
    const rides = await RideRequest.findAll({
      where: { requester_id: req.userId },
      include: [{ model: User, as: 'driver', attributes: RIDER_ATTRS }],
      order: [['created_at', 'DESC']],
    });
    res.json({ success: true, data: rides });
  } catch (err) {
    console.error('Get my rides error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch your rides.' });
  }
});

// GET /api/rides/driving — rides the current user is driving
router.get('/driving', authenticate, async (req, res) => {
  try {
    const rides = await RideRequest.findAll({
      where: {
        driver_id: req.userId,
        status: { [Op.in]: ['accepted', 'en_route', 'picked_up'] },
      },
      include: [{ model: User, as: 'requester', attributes: RIDER_ATTRS }],
      order: [['accepted_at', 'DESC']],
    });
    res.json({ success: true, data: rides });
  } catch (err) {
    console.error('Get driving rides error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch driving rides.' });
  }
});

// GET /api/rides/:id — single ride + computed routes
router.get('/:id', authenticate, async (req, res) => {
  try {
    const ride = await RideRequest.findByPk(req.params.id, {
      include: [
        { model: User, as: 'requester', attributes: RIDER_ATTRS },
        { model: User, as: 'driver',    attributes: RIDER_ATTRS },
      ],
    });

    if (!ride) {
      return res.status(404).json({ success: false, error: 'Ride request not found.' });
    }

    // Only the requester or driver can see details
    if (ride.requester_id !== req.userId && ride.driver_id !== req.userId) {
      return res.status(403).json({ success: false, error: 'Access denied.' });
    }

    let routes = null;
    try {
      routes = await computeRoutes(
        parseFloat(ride.pickup_lat),
        parseFloat(ride.pickup_lng),
        parseFloat(ride.destination_lat),
        parseFloat(ride.destination_lng),
      );
    } catch (routeErr) {
      console.error('Route computation failed:', routeErr.message);
    }

    res.json({ success: true, data: { ...ride.toJSON(), routes } });
  } catch (err) {
    console.error('Get ride error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch ride.' });
  }
});

// PATCH /api/rides/:id/accept — volunteer accepts
router.patch('/:id/accept', authenticate, async (req, res) => {
  try {
    const ride = await RideRequest.findByPk(req.params.id);

    if (!ride) return res.status(404).json({ success: false, error: 'Ride not found.' });
    if (ride.status !== 'pending') return res.status(400).json({ success: false, error: 'Ride is no longer available.' });
    if (ride.requester_id === req.userId) return res.status(400).json({ success: false, error: 'You cannot accept your own ride request.' });

    await ride.update({ driver_id: req.userId, status: 'accepted', accepted_at: new Date(), updated_at: new Date() });

    // Dismiss ride_request notifications for all users (non-blocking)
    setImmediate(async () => {
      try {
        await Notification.update(
          { is_read: true, is_dismissed: true },
          { where: { related_id: ride.ride_request_id, notification_type: 'ride_request', is_dismissed: false } }
        );
      } catch (err) {
        console.error('Failed to dismiss ride notifications:', err);
      }
    });

    // Notify the requester
    const driver = await User.findByPk(req.userId, { attributes: ['name'] });
    await Notification.create({
      user_id:           ride.requester_id,
      notification_type: 'ride_accepted',
      title:             'Your ride was accepted!',
      message:           `${driver?.name || 'A volunteer'} accepted your ride request and is on the way.`,
      related_id:        ride.ride_request_id,
      severity:          'high',
    });

    const updatedRide = await RideRequest.findByPk(ride.ride_request_id, {
      include: [
        { model: User, as: 'requester', attributes: RIDER_ATTRS },
        { model: User, as: 'driver',    attributes: RIDER_ATTRS },
      ],
    });

    res.json({ success: true, data: updatedRide });
  } catch (err) {
    console.error('Accept ride error:', err);
    res.status(500).json({ success: false, error: 'Failed to accept ride.' });
  }
});

// PATCH /api/rides/:id/status — update lifecycle status
router.patch('/:id/status', authenticate, async (req, res) => {
  try {
    const { status } = req.body;
    const ride = await RideRequest.findByPk(req.params.id);

    if (!ride) return res.status(404).json({ success: false, error: 'Ride not found.' });

    // Only driver or requester can update (driver for en_route/picked_up, requester for cancel)
    const isDriver    = ride.driver_id === req.userId;
    const isRequester = ride.requester_id === req.userId;

    if (!isDriver && !isRequester) {
      return res.status(403).json({ success: false, error: 'Access denied.' });
    }

    const updates = { status, updated_at: new Date() };
    if (status === 'completed') updates.completed_at = new Date();

    await ride.update(updates);

    // Notify the other party
    const notifyUserId = isDriver ? ride.requester_id : ride.driver_id;
    if (notifyUserId) {
      const statusMessages = {
        en_route:  { title: 'Driver is on the way',      msg: 'Your driver is heading to your pickup location.' },
        picked_up: { title: 'You\'ve been picked up',    msg: 'You are now en route to your destination.' },
        completed: { title: 'Ride completed',             msg: 'Your ride has been completed. Thank you!' },
        cancelled: { title: 'Ride cancelled',             msg: 'The ride request has been cancelled.' },
      };
      const notif = statusMessages[status];
      if (notif) {
        await Notification.create({
          user_id:           notifyUserId,
          notification_type: 'ride_status',
          title:             notif.title,
          message:           notif.msg,
          related_id:        ride.ride_request_id,
          severity:          'high',
        });
      }
    }

    res.json({ success: true, data: ride });
  } catch (err) {
    console.error('Update ride status error:', err);
    res.status(500).json({ success: false, error: 'Failed to update ride status.' });
  }
});

export default router;

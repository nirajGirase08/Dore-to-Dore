import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import Offer from '../models/Offer.js';
import OfferItem from '../models/OfferItem.js';
import User from '../models/User.js';

const router = express.Router();

const recalculateOfferStatus = async (offerId, currentStatus = null) => {
  const items = await OfferItem.findAll({
    where: { offer_id: offerId },
  });

  if (!items.length) {
    return currentStatus || 'active';
  }

  const completedCount = items.filter((item) => item.status === 'given').length;

  if (completedCount < items.length) {
    return 'active';
  }

  return 'fulfilled';
};

/**
 * @route   POST /api/offers
 * @desc    Create a new offer
 * @access  Private
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      title,
      description,
      location_lat,
      location_lng,
      location_address,
      delivery_available,
      available_from,
      available_until,
      items,
    } = req.body;

    // Validation
    if (!title || !location_lat || !location_lng || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Please provide title, location, and at least one item.',
      });
    }

    // Create offer
    const offer = await Offer.create({
      user_id: req.userId,
      title,
      description,
      location_lat,
      location_lng,
      location_address,
      delivery_available: delivery_available || false,
      available_from: available_from || new Date(),
      available_until,
      status: 'active',
    });

    // Create offer items
    const offerItems = await Promise.all(
      items.map((item) =>
        OfferItem.create({
          offer_id: offer.offer_id,
          resource_type: item.resource_type,
          quantity_total: item.quantity,
          quantity_remaining: item.quantity,
          notes: item.notes,
          status: 'available',
        })
      )
    );

    res.status(201).json({
      success: true,
      data: {
        offer,
        items: offerItems,
      },
      message: 'Offer created successfully.',
    });
  } catch (error) {
    console.error('Create offer error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create offer.',
    });
  }
});

/**
 * @route   GET /api/offers
 * @desc    Get all active offers
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const { status = 'active' } = req.query;

    const offers = await Offer.findAll({
      where: { status },
      include: [
        {
          model: OfferItem,
          as: 'items',
        },
        {
          model: User,
          as: 'user',
          attributes: ['user_id', 'name', 'email', 'phone', 'reputation_score'],
        },
      ],
      order: [['created_at', 'DESC']],
    });

    res.json({
      success: true,
      data: offers,
    });
  } catch (error) {
    console.error('Get offers error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch offers.',
    });
  }
});

/**
 * @route   GET /api/offers/my
 * @desc    Get current user's offers
 * @access  Private
 */
router.get('/my', authenticate, async (req, res) => {
  try {
    const offers = await Offer.findAll({
      where: { user_id: req.userId },
      include: [
        {
          model: OfferItem,
          as: 'items',
        },
      ],
      order: [['created_at', 'DESC']],
    });

    res.json({
      success: true,
      data: offers,
    });
  } catch (error) {
    console.error('Get my offers error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch your offers.',
    });
  }
});

/**
 * @route   GET /api/offers/:id
 * @desc    Get single offer by ID
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const offer = await Offer.findByPk(req.params.id, {
      include: [
        {
          model: OfferItem,
          as: 'items',
        },
        {
          model: User,
          as: 'user',
          attributes: ['user_id', 'name', 'email', 'phone', 'location_address', 'reputation_score'],
        },
      ],
    });

    if (!offer) {
      return res.status(404).json({
        success: false,
        error: 'Offer not found.',
      });
    }

    res.json({
      success: true,
      data: offer,
    });
  } catch (error) {
    console.error('Get offer error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch offer.',
    });
  }
});

/**
 * @route   PUT /api/offers/:id
 * @desc    Update offer
 * @access  Private (owner only)
 */
router.put('/:id', authenticate, async (req, res) => {
  try {
    const offer = await Offer.findByPk(req.params.id);

    if (!offer) {
      return res.status(404).json({
        success: false,
        error: 'Offer not found.',
      });
    }

    // Check ownership
    if (offer.user_id !== req.userId) {
      return res.status(403).json({
        success: false,
        error: 'You can only update your own offers.',
      });
    }

    const { title, description, status, delivery_available, available_until } = req.body;

    await offer.update({
      title: title || offer.title,
      description: description !== undefined ? description : offer.description,
      status: status || offer.status,
      delivery_available: delivery_available !== undefined ? delivery_available : offer.delivery_available,
      available_until: available_until || offer.available_until,
      updated_at: new Date(),
    });

    res.json({
      success: true,
      data: offer,
      message: 'Offer updated successfully.',
    });
  } catch (error) {
    console.error('Update offer error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update offer.',
    });
  }
});

/**
 * @route   PATCH /api/offers/:id/status
 * @desc    Update offer status only
 * @access  Private (owner only)
 */
router.patch('/:id/status', authenticate, async (req, res) => {
  try {
    const offer = await Offer.findByPk(req.params.id);

    if (!offer) {
      return res.status(404).json({
        success: false,
        error: 'Offer not found.',
      });
    }

    // Check ownership
    if (offer.user_id !== req.userId) {
      return res.status(403).json({
        success: false,
        error: 'You can only update your own offers.',
      });
    }

    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status is required.',
      });
    }

    await offer.update({
      status,
      updated_at: new Date(),
    });

    res.json({
      success: true,
      data: offer,
      message: 'Offer status updated successfully.',
    });
  } catch (error) {
    console.error('Update offer status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update offer status.',
    });
  }
});

/**
 * @route   PATCH /api/offers/:id/items/:itemId/fulfill
 * @desc    Mark a single offer item as given and update parent offer status
 * @access  Private (owner only)
 */
router.patch('/:id/items/:itemId/fulfill', authenticate, async (req, res) => {
  try {
    const offer = await Offer.findByPk(req.params.id);

    if (!offer) {
      return res.status(404).json({
        success: false,
        error: 'Offer not found.',
      });
    }

    if (offer.user_id !== req.userId) {
      return res.status(403).json({
        success: false,
        error: 'You can only update your own offers.',
      });
    }

    const item = await OfferItem.findOne({
      where: {
        item_id: req.params.itemId,
        offer_id: offer.offer_id,
      },
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        error: 'Offer item not found.',
      });
    }

    await item.update({
      quantity_remaining: 0,
      status: 'given',
    });

    const nextStatus = await recalculateOfferStatus(offer.offer_id, offer.status);

    await offer.update({
      status: nextStatus,
      updated_at: new Date(),
    });

    const updatedOffer = await Offer.findByPk(offer.offer_id, {
      include: [
        {
          model: OfferItem,
          as: 'items',
        },
      ],
    });

    res.json({
      success: true,
      data: updatedOffer,
      message: 'Offer item marked fulfilled.',
    });
  } catch (error) {
    console.error('Fulfill offer item error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update offer item.',
    });
  }
});

/**
 * @route   DELETE /api/offers/:id
 * @desc    Delete offer
 * @access  Private (owner only)
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const offer = await Offer.findByPk(req.params.id);

    if (!offer) {
      return res.status(404).json({
        success: false,
        error: 'Offer not found.',
      });
    }

    // Check ownership
    if (offer.user_id !== req.userId) {
      return res.status(403).json({
        success: false,
        error: 'You can only delete your own offers.',
      });
    }

    await offer.destroy();

    res.json({
      success: true,
      message: 'Offer deleted successfully.',
    });
  } catch (error) {
    console.error('Delete offer error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete offer.',
    });
  }
});

export default router;

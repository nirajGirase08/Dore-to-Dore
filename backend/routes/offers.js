import express from 'express';
import { authenticate, optionalAuth } from '../middleware/authMiddleware.js';
import Offer from '../models/Offer.js';
import OfferItem from '../models/OfferItem.js';
import User from '../models/User.js';
import Conversation from '../models/Conversation.js';
import AssistanceTransaction from '../models/AssistanceTransaction.js';
import { Op } from 'sequelize';

const router = express.Router();
const getTargetGenderFilter = (gender) => {
  if (gender === 'male' || gender === 'female') {
    return [{ target_gender: null }, { target_gender: gender }];
  }

  return [{ target_gender: null }];
};

const recalculateOfferStatus = async (offerId, currentStatus = null) => {
  const items = await OfferItem.findAll({
    where: { offer_id: offerId },
  });

  if (!items.length) {
    return 'fulfilled';
  }

  const completedCount = items.filter((item) => item.status === 'given').length;

  if (completedCount < items.length) {
    return 'active';
  }

  return 'fulfilled';
};

const replaceOfferItems = async (offerId, items) => {
  await OfferItem.destroy({ where: { offer_id: offerId } });

  return Promise.all(
    items.map((item) =>
      OfferItem.create({
        offer_id: offerId,
        resource_type: item.resource_type,
        quantity_total: item.quantity,
        quantity_remaining: item.quantity,
        notes: item.notes,
        image_url: item.image_url || null,
        status: 'available',
      })
    )
  );
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
      target_gender,
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
      target_gender: target_gender || null,
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
          image_url: item.image_url || null,
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
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { status = 'active' } = req.query;

    const offers = await Offer.findAll({
      where: {
        status,
        [Op.or]: getTargetGenderFilter(req.user?.gender),
      },
      include: [
        {
          model: OfferItem,
          as: 'items',
        },
        {
          model: User,
          as: 'user',
          attributes: ['user_id', 'name', 'email', 'phone', 'gender', 'location_lat', 'location_lng', 'location_address', 'profile_image_url', 'reputation_score'],
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
          attributes: ['user_id', 'name', 'email', 'phone', 'gender', 'location_lat', 'location_lng', 'location_address', 'profile_image_url', 'reputation_score'],
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

    const {
      title,
      description,
      status,
      delivery_available,
      available_until,
      target_gender,
      location_address,
      location_lat,
      location_lng,
      items,
    } = req.body;

    if (items && (!Array.isArray(items) || items.length === 0)) {
      return res.status(400).json({
        success: false,
        error: 'Offers must include at least one item.',
      });
    }

    await offer.update({
      title: title || offer.title,
      description: description !== undefined ? description : offer.description,
      status: status || offer.status,
      target_gender: target_gender !== undefined ? (target_gender || null) : offer.target_gender,
      delivery_available: delivery_available !== undefined ? delivery_available : offer.delivery_available,
      available_until: available_until || offer.available_until,
      location_address: location_address || offer.location_address,
      location_lat: location_lat || offer.location_lat,
      location_lng: location_lng || offer.location_lng,
      updated_at: new Date(),
    });

    if (items) {
      await replaceOfferItems(offer.offer_id, items);
      const nextStatus = await recalculateOfferStatus(offer.offer_id, offer.status);
      await offer.update({ status: nextStatus });
    }

    const updatedOffer = await Offer.findByPk(offer.offer_id, {
      include: [
        {
          model: OfferItem,
          as: 'items',
        },
        {
          model: User,
          as: 'user',
          attributes: ['user_id', 'name', 'email', 'phone', 'gender', 'location_lat', 'location_lng', 'location_address', 'profile_image_url', 'reputation_score'],
        },
      ],
    });

    res.json({
      success: true,
      data: updatedOffer,
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
    const { conversation_id } = req.body;
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

    if (!conversation_id) {
      return res.status(400).json({
        success: false,
        error: 'conversation_id is required to record who received this help.',
      });
    }

    const conversation = await Conversation.findOne({
      where: {
        conversation_id,
        [Op.or]: [
          { participant_1_id: req.userId },
          { participant_2_id: req.userId },
        ],
      },
    });

    if (!conversation) {
      return res.status(400).json({
        success: false,
        error: 'Please choose a valid conversation for this fulfillment.',
      });
    }

    if (conversation.offer_id && conversation.offer_id !== offer.offer_id) {
      return res.status(400).json({
        success: false,
        error: 'This conversation is already linked to a different offer.',
      });
    }

    if (!conversation.offer_id) {
      await conversation.update({
        offer_id: offer.offer_id,
      });
    }

    const recipientUserId = conversation.participant_1_id === req.userId
      ? conversation.participant_2_id
      : conversation.participant_1_id;

    await AssistanceTransaction.create({
      conversation_id: conversation.conversation_id,
      offer_id: offer.offer_id,
      offer_item_id: item.item_id,
      request_id: conversation.request_id || null,
      helper_user_id: req.userId,
      recipient_user_id: recipientUserId,
      resource_type: item.resource_type,
      quantity: 1,
      completion_source: 'manual',
      completed_at: new Date(),
    });

    await item.destroy();

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
      message: 'Offer item fulfilled and removed.',
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

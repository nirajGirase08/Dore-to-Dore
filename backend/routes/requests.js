import express from 'express';
import { Op } from 'sequelize';
import { authenticate, optionalAuth } from '../middleware/authMiddleware.js';
import Request from '../models/Request.js';
import RequestItem from '../models/RequestItem.js';
import User from '../models/User.js';
import Conversation from '../models/Conversation.js';
import AssistanceTransaction from '../models/AssistanceTransaction.js';

const router = express.Router();
const getTargetGenderFilter = (gender) => {
  if (gender === 'male' || gender === 'female') {
    return [{ target_gender: null }, { target_gender: gender }];
  }

  return [{ target_gender: null }];
};

const recalculateRequestStatus = async (requestId, currentStatus = null) => {
  const items = await RequestItem.findAll({
    where: { request_id: requestId },
  });

  if (!items.length) {
    return 'fulfilled';
  }

  const completedCount = items.filter((item) => item.status === 'fulfilled').length;

  if (completedCount < items.length) {
    return 'active';
  }

  return 'fulfilled';
};

const replaceRequestItems = async (requestId, items) => {
  await RequestItem.destroy({ where: { request_id: requestId } });

  return Promise.all(
    items.map((item) =>
      RequestItem.create({
        request_id: requestId,
        resource_type: item.resource_type,
        quantity_needed: item.quantity,
        notes: item.notes,
        status: 'pending',
      })
    )
  );
};

/**
 * @route   POST /api/requests
 * @desc    Create a new request
 * @access  Private
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      title,
      description,
      urgency_level,
      location_lat,
      location_lng,
      location_address,
      target_gender,
      items,
    } = req.body;

    // Validation
    if (!title || !location_lat || !location_lng || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Please provide title, location, and at least one item.',
      });
    }

    // Create request
    const request = await Request.create({
      user_id: req.userId,
      title,
      description,
      urgency_level: urgency_level || 'medium',
      location_lat,
      location_lng,
      location_address,
      target_gender: target_gender || null,
      status: 'active',
    });

    // Create request items
    const requestItems = await Promise.all(
      items.map((item) =>
        RequestItem.create({
          request_id: request.request_id,
          resource_type: item.resource_type,
          quantity_needed: item.quantity,
          notes: item.notes,
          status: 'pending',
        })
      )
    );

    res.status(201).json({
      success: true,
      data: {
        request,
        items: requestItems,
      },
      message: 'Request created successfully.',
    });
  } catch (error) {
    console.error('Create request error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create request.',
    });
  }
});

/**
 * @route   GET /api/requests
 * @desc    Get all active requests
 * @access  Public
 */
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { status = 'active', urgency } = req.query;

    const where = { status };
    if (urgency) {
      where.urgency_level = urgency;
    }
    where[Op.or] = getTargetGenderFilter(req.user?.gender);

    const requests = await Request.findAll({
      where,
      include: [
        {
          model: RequestItem,
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
      data: requests,
    });
  } catch (error) {
    console.error('Get requests error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch requests.',
    });
  }
});

/**
 * @route   GET /api/requests/my
 * @desc    Get current user's requests
 * @access  Private
 */
router.get('/my', authenticate, async (req, res) => {
  try {
    const requests = await Request.findAll({
      where: { user_id: req.userId },
      include: [
        {
          model: RequestItem,
          as: 'items',
        },
      ],
      order: [['created_at', 'DESC']],
    });

    res.json({
      success: true,
      data: requests,
    });
  } catch (error) {
    console.error('Get my requests error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch your requests.',
    });
  }
});

/**
 * @route   GET /api/requests/:id
 * @desc    Get single request by ID
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const request = await Request.findByPk(req.params.id, {
      include: [
        {
          model: RequestItem,
          as: 'items',
        },
        {
          model: User,
          as: 'user',
          attributes: ['user_id', 'name', 'email', 'phone', 'gender', 'location_lat', 'location_lng', 'location_address', 'profile_image_url', 'reputation_score'],
        },
      ],
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        error: 'Request not found.',
      });
    }

    res.json({
      success: true,
      data: request,
    });
  } catch (error) {
    console.error('Get request error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch request.',
    });
  }
});

/**
 * @route   PUT /api/requests/:id
 * @desc    Update request
 * @access  Private (owner only)
 */
router.put('/:id', authenticate, async (req, res) => {
  try {
    const request = await Request.findByPk(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        error: 'Request not found.',
      });
    }

    // Check ownership
    if (request.user_id !== req.userId) {
      return res.status(403).json({
        success: false,
        error: 'You can only update your own requests.',
      });
    }

    const {
      title,
      description,
      status,
      urgency_level,
      target_gender,
      location_address,
      location_lat,
      location_lng,
      items,
    } = req.body;

    if (items && (!Array.isArray(items) || items.length === 0)) {
      return res.status(400).json({
        success: false,
        error: 'Requests must include at least one item.',
      });
    }

    await request.update({
      title: title || request.title,
      description: description !== undefined ? description : request.description,
      status: status || request.status,
      urgency_level: urgency_level || request.urgency_level,
      target_gender: target_gender !== undefined ? (target_gender || null) : request.target_gender,
      location_address: location_address || request.location_address,
      location_lat: location_lat || request.location_lat,
      location_lng: location_lng || request.location_lng,
      updated_at: new Date(),
    });

    if (items) {
      await replaceRequestItems(request.request_id, items);
      const nextStatus = await recalculateRequestStatus(request.request_id, request.status);
      await request.update({ status: nextStatus });
    }

    const updatedRequest = await Request.findByPk(request.request_id, {
      include: [
        {
          model: RequestItem,
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
      data: updatedRequest,
      message: 'Request updated successfully.',
    });
  } catch (error) {
    console.error('Update request error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update request.',
    });
  }
});

/**
 * @route   PATCH /api/requests/:id/status
 * @desc    Update request status only
 * @access  Private (owner only)
 */
router.patch('/:id/status', authenticate, async (req, res) => {
  try {
    const request = await Request.findByPk(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        error: 'Request not found.',
      });
    }

    // Check ownership
    if (request.user_id !== req.userId) {
      return res.status(403).json({
        success: false,
        error: 'You can only update your own requests.',
      });
    }

    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status is required.',
      });
    }

    await request.update({
      status,
      updated_at: new Date(),
    });

    res.json({
      success: true,
      data: request,
      message: 'Request status updated successfully.',
    });
  } catch (error) {
    console.error('Update request status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update request status.',
    });
  }
});

/**
 * @route   PATCH /api/requests/:id/items/:itemId/fulfill
 * @desc    Mark a single request item as fulfilled and update parent request status
 * @access  Private (owner only)
 */
router.patch('/:id/items/:itemId/fulfill', authenticate, async (req, res) => {
  try {
    const { conversation_id } = req.body;
    const request = await Request.findByPk(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        error: 'Request not found.',
      });
    }

    if (request.user_id !== req.userId) {
      return res.status(403).json({
        success: false,
        error: 'You can only update your own requests.',
      });
    }

    const item = await RequestItem.findOne({
      where: {
        item_id: req.params.itemId,
        request_id: request.request_id,
      },
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        error: 'Request item not found.',
      });
    }

    if (!conversation_id) {
      return res.status(400).json({
        success: false,
        error: 'conversation_id is required to record who fulfilled this request.',
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

    if (conversation.request_id && conversation.request_id !== request.request_id) {
      return res.status(400).json({
        success: false,
        error: 'This conversation is already linked to a different request.',
      });
    }

    if (!conversation.request_id) {
      await conversation.update({
        request_id: request.request_id,
      });
    }

    const helperUserId = conversation.participant_1_id === req.userId
      ? conversation.participant_2_id
      : conversation.participant_1_id;

    await AssistanceTransaction.create({
      conversation_id: conversation.conversation_id,
      request_id: request.request_id,
      request_item_id: item.item_id,
      offer_id: conversation.offer_id || null,
      helper_user_id: helperUserId,
      recipient_user_id: req.userId,
      resource_type: item.resource_type,
      quantity: 1,
      completion_source: 'manual',
      completed_at: new Date(),
    });

    await item.destroy();

    const nextStatus = await recalculateRequestStatus(request.request_id, request.status);

    await request.update({
      status: nextStatus,
      updated_at: new Date(),
    });

    const updatedRequest = await Request.findByPk(request.request_id, {
      include: [
        {
          model: RequestItem,
          as: 'items',
        },
      ],
    });

    res.json({
      success: true,
      data: updatedRequest,
      message: 'Request item fulfilled and removed.',
    });
  } catch (error) {
    console.error('Fulfill request item error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update request item.',
    });
  }
});

/**
 * @route   DELETE /api/requests/:id
 * @desc    Delete request
 * @access  Private (owner only)
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const request = await Request.findByPk(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        error: 'Request not found.',
      });
    }

    // Check ownership
    if (request.user_id !== req.userId) {
      return res.status(403).json({
        success: false,
        error: 'You can only delete your own requests.',
      });
    }

    await request.destroy();

    res.json({
      success: true,
      message: 'Request deleted successfully.',
    });
  } catch (error) {
    console.error('Delete request error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete request.',
    });
  }
});

export default router;

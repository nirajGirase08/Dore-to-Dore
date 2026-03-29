import express from 'express';
import { Op } from 'sequelize';
import { Conversation, Message, User, Offer, Request } from '../models/index.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get unread message count for current user
router.get('/unread-count', authenticate, async (req, res) => {
  try {
    const userId = req.userId;

    const count = await Message.count({
      where: {
        sender_id: { [Op.ne]: userId },
        is_read: false
      },
      include: [
        {
          model: Conversation,
          as: 'conversation',
          required: true,
          where: {
            [Op.or]: [
              { participant_1_id: userId },
              { participant_2_id: userId }
            ]
          }
        }
      ]
    });

    res.json({
      success: true,
      data: { unread_count: count }
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get unread count'
    });
  }
});

// Get the most recent unread message for the current user
router.get('/unread-latest', authenticate, async (req, res) => {
  try {
    const userId = req.userId;

    const latestUnread = await Message.findOne({
      where: {
        sender_id: { [Op.ne]: userId },
        is_read: false,
      },
      include: [
        {
          model: Conversation,
          as: 'conversation',
          required: true,
          where: {
            [Op.or]: [
              { participant_1_id: userId },
              { participant_2_id: userId },
            ],
          },
          include: [
            {
              model: User,
              as: 'user1',
              attributes: ['user_id', 'name', 'user_type'],
            },
            {
              model: User,
              as: 'user2',
              attributes: ['user_id', 'name', 'user_type'],
            },
          ],
        },
        {
          model: User,
          as: 'sender',
          attributes: ['user_id', 'name', 'user_type'],
        },
      ],
      order: [['created_at', 'DESC']],
    });

    if (!latestUnread) {
      return res.json({
        success: true,
        data: null,
      });
    }

    const unreadData = latestUnread.toJSON();
    const otherUser = unreadData.conversation.participant_1_id === userId
      ? unreadData.conversation.user2
      : unreadData.conversation.user1;

    res.json({
      success: true,
      data: {
        message_id: unreadData.message_id,
        message_text: unreadData.message_text,
        created_at: unreadData.created_at || unreadData.sent_at,
        conversation_id: unreadData.conversation_id,
        sender: unreadData.sender,
        other_user: otherUser,
      },
    });
  } catch (error) {
    console.error('Get latest unread message error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch latest unread message',
    });
  }
});

// Get all conversations for current user
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.userId;

    const conversations = await Conversation.findAll({
      where: {
        [Op.or]: [
          { participant_1_id: userId },
          { participant_2_id: userId }
        ]
      },
      include: [
        {
          model: User,
          as: 'user1',
          attributes: ['user_id', 'name', 'email', 'user_type']
        },
        {
          model: User,
          as: 'user2',
          attributes: ['user_id', 'name', 'email', 'user_type']
        },
        {
          model: Message,
          as: 'messages',
          limit: 1,
          order: [['sent_at', 'DESC']],
          attributes: ['message_id', 'message_text', 'sender_id', 'sent_at', 'created_at', 'is_read'],
          separate: true
        }
      ],
      order: [['last_message_at', 'DESC']]
    });

    // Transform data to include "other user" info
    const transformedConversations = conversations.map(conv => {
      const convData = conv.toJSON();
      const otherUser = convData.participant_1_id === userId ? convData.user2 : convData.user1;
      const lastMessage = convData.messages?.[0]
        ? {
            ...convData.messages[0],
            created_at: convData.messages[0].created_at || convData.messages[0].sent_at,
          }
        : null;

      return {
        conversation_id: convData.conversation_id,
        other_user: otherUser,
        last_message: lastMessage,
        last_message_at: convData.last_message_at,
        created_at: convData.created_at
      };
    });

    res.json({
      success: true,
      data: transformedConversations
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch conversations'
    });
  }
});

// Get conversations related to a specific request or offer for the owner
router.get('/related/options', authenticate, async (req, res) => {
  try {
    const { request_id, offer_id } = req.query;
    const userId = req.userId;

    if (!request_id && !offer_id) {
      return res.status(400).json({
        success: false,
        error: 'request_id or offer_id is required',
      });
    }

    const baseParticipantWhere = {
      [Op.or]: [
        { participant_1_id: userId },
        { participant_2_id: userId },
      ],
    };

    const where = {};

    if (request_id) {
      where.request_id = request_id;
    }

    if (offer_id) {
      where.offer_id = offer_id;
    }

    let conversations = await Conversation.findAll({
      where: {
        ...baseParticipantWhere,
        ...where,
      },
      include: [
        {
          model: User,
          as: 'user1',
          attributes: ['user_id', 'name', 'email', 'phone', 'profile_image_url'],
        },
        {
          model: User,
          as: 'user2',
          attributes: ['user_id', 'name', 'email', 'phone', 'profile_image_url'],
        },
      ],
      order: [['last_message_at', 'DESC']],
    });

    // Fallback: if a conversation was started from the other side's request/offer,
    // it may not carry the current offer_id/request_id. In that case surface the
    // user's existing conversations so attribution can still be recorded.
    if (conversations.length === 0) {
      conversations = await Conversation.findAll({
        where: baseParticipantWhere,
        include: [
          {
            model: User,
            as: 'user1',
            attributes: ['user_id', 'name', 'email', 'phone', 'profile_image_url'],
          },
          {
            model: User,
            as: 'user2',
            attributes: ['user_id', 'name', 'email', 'phone', 'profile_image_url'],
          },
        ],
        order: [['last_message_at', 'DESC']],
      });
    }

    const dedupedByUser = new Map();

    conversations.forEach((conversation) => {
      const conversationData = conversation.toJSON();
      const otherUser = conversationData.participant_1_id === userId
        ? conversationData.user2
        : conversationData.user1;
      const otherUserId = otherUser?.user_id;

      if (!otherUserId || dedupedByUser.has(otherUserId)) {
        return;
      }

      dedupedByUser.set(otherUserId, {
        conversation_id: conversationData.conversation_id,
        other_user: otherUser,
        last_message_at: conversationData.last_message_at,
      });
    });

    const options = Array.from(dedupedByUser.values());

    res.json({
      success: true,
      data: options,
    });
  } catch (error) {
    console.error('Get related conversation options error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch related conversations',
    });
  }
});

// Get single conversation with all messages
router.get('/:id', authenticate, async (req, res) => {
  try {
    const conversationId = req.params.id;
    const userId = req.userId;

    const conversation = await Conversation.findOne({
      where: {
        conversation_id: conversationId,
        [Op.or]: [
          { participant_1_id: userId },
          { participant_2_id: userId }
        ]
      },
      include: [
        {
          model: User,
          as: 'user1',
          attributes: ['user_id', 'name', 'email', 'user_type']
        },
        {
          model: User,
          as: 'user2',
          attributes: ['user_id', 'name', 'email', 'user_type']
        },
        {
          model: Message,
          as: 'messages',
          include: [
            {
              model: User,
              as: 'sender',
              attributes: ['user_id', 'name']
            }
          ],
          order: [['sent_at', 'ASC']]
        }
      ]
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found or access denied'
      });
    }

    // Mark messages as read for current user
    await Message.update(
      { is_read: true },
      {
        where: {
          conversation_id: conversationId,
          sender_id: { [Op.ne]: userId },
          is_read: false
        }
      }
    );

    const convData = conversation.toJSON();
    const otherUser = convData.participant_1_id === userId ? convData.user2 : convData.user1;
    const normalizedMessages = (convData.messages || []).map((message) => ({
      ...message,
      created_at: message.created_at || message.sent_at,
    }));

    res.json({
      success: true,
      data: {
        conversation_id: convData.conversation_id,
        other_user: otherUser,
        messages: normalizedMessages,
        created_at: convData.created_at
      }
    });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch conversation'
    });
  }
});

// Create or get existing conversation with another user
router.post('/', authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    const { other_user_id, initial_message, offer_id, request_id } = req.body;

    if (!other_user_id) {
      return res.status(400).json({
        success: false,
        error: 'other_user_id is required'
      });
    }

    if (userId === other_user_id) {
      return res.status(400).json({
        success: false,
        error: 'Cannot create conversation with yourself'
      });
    }

    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      where: {
        [Op.or]: [
          { participant_1_id: userId, participant_2_id: other_user_id },
          { participant_1_id: other_user_id, participant_2_id: userId }
        ]
      },
      include: [
        { model: User, as: 'user1', attributes: ['user_id', 'name', 'email'] },
        { model: User, as: 'user2', attributes: ['user_id', 'name', 'email'] }
      ]
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participant_1_id: userId,
        participant_2_id: other_user_id,
        offer_id: offer_id || null,
        request_id: request_id || null,
        last_message_at: new Date()
      });

      conversation = await Conversation.findByPk(conversation.conversation_id, {
        include: [
          { model: User, as: 'user1', attributes: ['user_id', 'name', 'email'] },
          { model: User, as: 'user2', attributes: ['user_id', 'name', 'email'] }
        ]
      });
    }

    if (offer_id || request_id) {
      await conversation.update({
        offer_id: offer_id || conversation.offer_id || null,
        request_id: request_id || conversation.request_id || null,
      });
    }

    if (offer_id || request_id) {
      await conversation.update({
        offer_id: offer_id || conversation.offer_id || null,
        request_id: request_id || conversation.request_id || null,
      });
    }

    if (isNewConverstaion && initial_message) {
      await Message.create({
        conversation_id: conversation.conversation_id,
        sender_id: userId,
        recipient_id: other_user_id,
        message_text: initial_message,
        is_read: false
      });

      await conversation.update({ last_message_at: new Date() });
    }

    if (offer_id) {
      const offer = await Offer.findByPk(offer_id);
      if (!offer) console.log('Offer not found with id:', offer_id);
    }

    if (request_id) {
      const request = await Request.findByPk(request_id);
      if (!request) console.log('Request not found with id:', request_id);
    }

    const convData = conversation.toJSON();
    const otherUser = convData.participant_1_id === userId ? convData.user2 : convData.user1;

    res.json({
      success: true,
      data: {
        conversation_id: convData.conversation_id,
        other_user: otherUser,
        created_at: convData.created_at
      }
    });
  } catch (error) {
    console.error('Create conversation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create conversation'
    });
  }
});

export default router;

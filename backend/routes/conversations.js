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
          attributes: ['message_id', 'message_text', 'sender_id', 'sent_at', 'is_read'],
          separate: true
        }
      ],
      order: [['last_message_at', 'DESC']]
    });

    // Transform data to include "other user" info
    const transformedConversations = conversations.map(conv => {
      const convData = conv.toJSON();
      const otherUser = convData.participant_1_id === userId ? convData.user2 : convData.user1;
      const lastMessage = convData.messages?.[0] || null;

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

    res.json({
      success: true,
      data: {
        conversation_id: convData.conversation_id,
        other_user: otherUser,
        messages: convData.messages,
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
        last_message_at: new Date()
      });

      conversation = await Conversation.findByPk(conversation.conversation_id, {
        include: [
          { model: User, as: 'user1', attributes: ['user_id', 'name', 'email'] },
          { model: User, as: 'user2', attributes: ['user_id', 'name', 'email'] }
        ]
      });
    }

    if (initial_message) {
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

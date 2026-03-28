import express from 'express';
import { Op } from 'sequelize';
import { Message, Conversation, User } from '../models/index.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

// Send a new message
router.post('/', authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    const { conversation_id, message_text } = req.body;

    if (!conversation_id || !message_text) {
      return res.status(400).json({
        success: false,
        error: 'conversation_id and message_text are required'
      });
    }

    // Verify user is part of this conversation
    const conversation = await Conversation.findOne({
      where: {
        conversation_id,
        [Op.or]: [
          { user1_id: userId },
          { user2_id: userId }
        ]
      }
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found or access denied'
      });
    }

    // Create message
    const message = await Message.create({
      conversation_id,
      sender_id: userId,
      message_text,
      is_read: false
    });

    // Update conversation last_message_at
    await conversation.update({
      last_message_at: new Date()
    });

    // Reload message with sender info
    const messageWithSender = await Message.findByPk(message.message_id, {
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['user_id', 'name']
        }
      ]
    });

    res.json({
      success: true,
      data: messageWithSender
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send message'
    });
  }
});

export default router;

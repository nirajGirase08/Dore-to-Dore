import express from 'express';
import { AssistanceFeedback, AssistanceTransaction, Offer, Request, User } from '../models/index.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

const buildBadges = ({ helpedCount, receivedHelpCount, feedbackCount, helpfulFeedbackRate }) => {
  const badges = [];

  if (helpedCount >= 1) {
    badges.push({ key: 'first_helper', label: 'First Helper' });
  }

  if (helpedCount >= 5) {
    badges.push({ key: 'reliable_helper', label: 'Reliable Helper' });
  }

  if (helpedCount >= 10) {
    badges.push({ key: 'community_supporter', label: 'Community Supporter' });
  }

  if (receivedHelpCount >= 1 && helpedCount >= 1) {
    badges.push({ key: 'mutual_aid', label: 'Mutual Aid' });
  }

  if (feedbackCount >= 3 && helpfulFeedbackRate >= 0.8) {
    badges.push({ key: 'highly_helpful', label: 'Highly Helpful' });
  }

  return badges;
};

const getTrustSummary = async (userId) => {
  const [helpedCount, receivedHelpCount, feedbackCount, positiveFeedbackCount] = await Promise.all([
    AssistanceTransaction.count({ where: { helper_user_id: userId } }),
    AssistanceTransaction.count({ where: { recipient_user_id: userId } }),
    AssistanceFeedback.count({ where: { reviewee_user_id: userId } }),
    AssistanceFeedback.count({ where: { reviewee_user_id: userId, was_helpful: true } }),
  ]);

  const helpfulFeedbackRate = feedbackCount > 0 ? positiveFeedbackCount / feedbackCount : null;

  return {
    helped_count: helpedCount,
    received_help_count: receivedHelpCount,
    feedback_count: feedbackCount,
    helpful_feedback_count: positiveFeedbackCount,
    helpful_feedback_rate: helpfulFeedbackRate,
    badges: buildBadges({
      helpedCount,
      receivedHelpCount,
      feedbackCount,
      helpfulFeedbackRate: helpfulFeedbackRate || 0,
    }),
  };
};

router.get('/me', authenticate, async (req, res) => {
  try {
    const summary = await getTrustSummary(req.userId);

    const pendingTransactions = await AssistanceTransaction.findAll({
      where: { recipient_user_id: req.userId },
      include: [
        {
          model: AssistanceFeedback,
          as: 'feedback',
          required: false,
        },
        {
          model: User,
          as: 'helper',
          attributes: ['user_id', 'name', 'profile_image_url'],
        },
        {
          model: Offer,
          as: 'offer',
          attributes: ['offer_id', 'title'],
          required: false,
        },
        {
          model: Request,
          as: 'request',
          attributes: ['request_id', 'title'],
          required: false,
        },
      ],
      order: [['completed_at', 'DESC']],
    });

    const pendingFeedback = pendingTransactions
      .filter((transaction) => !transaction.feedback)
      .map((transaction) => {
        const data = transaction.toJSON();
        return {
          transaction_id: data.transaction_id,
          helper: data.helper,
          resource_type: data.resource_type,
          completed_at: data.completed_at,
          context_title: data.offer?.title || data.request?.title || 'Completed help',
        };
      });

    res.json({
      success: true,
      data: {
        summary,
        pending_feedback: pendingFeedback,
      },
    });
  } catch (error) {
    console.error('Get my trust summary error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load trust summary.',
    });
  }
});

router.get('/users/:userId', async (req, res) => {
  try {
    const summary = await getTrustSummary(req.params.userId);

    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error('Get public trust summary error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load trust summary.',
    });
  }
});

router.post('/feedback/:transactionId', authenticate, async (req, res) => {
  try {
    const { was_helpful, note } = req.body;
    const transactionId = req.params.transactionId;

    if (typeof was_helpful !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'was_helpful must be true or false.',
      });
    }

    const transaction = await AssistanceTransaction.findByPk(transactionId, {
      include: [
        {
          model: AssistanceFeedback,
          as: 'feedback',
          required: false,
        },
      ],
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found.',
      });
    }

    if (transaction.recipient_user_id !== req.userId) {
      return res.status(403).json({
        success: false,
        error: 'Only the recipient can submit this feedback.',
      });
    }

    if (transaction.feedback) {
      return res.status(400).json({
        success: false,
        error: 'Feedback has already been submitted for this transaction.',
      });
    }

    const feedback = await AssistanceFeedback.create({
      transaction_id: transaction.transaction_id,
      reviewer_user_id: req.userId,
      reviewee_user_id: transaction.helper_user_id,
      was_helpful,
      note: note?.trim() || null,
    });

    res.status(201).json({
      success: true,
      data: feedback,
      message: 'Feedback submitted successfully.',
    });
  } catch (error) {
    console.error('Submit assistance feedback error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit feedback.',
    });
  }
});

export default router;

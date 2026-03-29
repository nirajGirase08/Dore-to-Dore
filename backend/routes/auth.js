import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();
const VALID_GENDERS = ['male', 'female', 'prefer_not_to_answer'];

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', async (req, res) => {
  try {
    const {
      email,
      password,
      name,
      phone,
      gender,
      location_lat,
      location_lng,
      location_address,
      user_type,
    } = req.body;

    // Validation
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        error: 'Please provide email, password, and name.',
      });
    }

    if (!gender || !VALID_GENDERS.includes(gender)) {
      return res.status(400).json({
        success: false,
        error: 'Please select a valid gender option.',
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User with this email already exists.',
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      email,
      password_hash,
      name,
      phone,
      gender,
      location_lat,
      location_lng,
      location_address,
      user_type: user_type || 'student',
      reputation_score: 0,
      created_at: new Date(),
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.user_id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Return user data (without password) and token
    res.status(201).json({
      success: true,
      data: {
        token,
        user: user.toSafeObject(),
      },
      message: 'User registered successfully.',
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to register user.',
    });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and return token
 * @access  Public
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide email and password.',
      });
    }

    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials.',
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials.',
      });
    }

    // Update last login
    await user.update({ last_login: new Date() });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.user_id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Return user data and token
    res.json({
      success: true,
      data: {
        token,
        user: user.toSafeObject(),
      },
      message: 'Login successful.',
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to login.',
    });
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current authenticated user
 * @access  Private
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        user: req.user,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user information.',
    });
  }
});

/**
 * @route   PUT /api/auth/profile
 * @desc    Update current authenticated user's profile
 * @access  Private
 */
router.put('/profile', authenticate, async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      location_address,
    } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        error: 'Name and email are required.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const trimmedName = name.trim();

    const existingUser = await User.findOne({ where: { email: normalizedEmail } });
    if (existingUser && existingUser.user_id !== req.userId) {
      return res.status(400).json({
        success: false,
        error: 'Another account is already using this email.',
      });
    }

    const user = await User.findByPk(req.userId);
    await user.update({
      name: trimmedName,
      email: normalizedEmail,
      phone: phone?.trim() || null,
      location_address: location_address?.trim() || null,
    });

    res.json({
      success: true,
      data: {
        user: user.toSafeObject(),
      },
      message: 'Profile updated successfully.',
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile.',
    });
  }
});

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (client-side will remove token)
 * @access  Private
 */
router.post('/logout', authenticate, (req, res) => {
  // In a JWT-based system, logout is typically handled client-side
  // by removing the token. This endpoint is here for consistency.
  res.json({
    success: true,
    message: 'Logged out successfully.',
  });
});

export default router;

import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { authenticate } from '../middleware/authMiddleware.js';
import User from '../models/User.js';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsRoot = path.join(__dirname, '..', 'uploads');
const profileUploadsDir = path.join(uploadsRoot, 'profiles');
const offerUploadsDir = path.join(uploadsRoot, 'offers');
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

fs.mkdirSync(profileUploadsDir, { recursive: true });
fs.mkdirSync(offerUploadsDir, { recursive: true });

const getExtensionFromMimeType = (mimeType) => {
  switch (mimeType) {
    case 'image/jpeg':
      return '.jpg';
    case 'image/png':
      return '.png';
    case 'image/webp':
      return '.webp';
    default:
      return '';
  }
};

const buildPublicUrl = (req, relativePath) => (
  `${req.protocol}://${req.get('host')}${relativePath}`
);

const decodeImagePayload = ({ base64Data, mimeType }) => {
  if (!base64Data || !mimeType) {
    return { error: 'Image data and MIME type are required.' };
  }

  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    return { error: 'Only JPG, PNG, and WEBP images are allowed.' };
  }

  const buffer = Buffer.from(base64Data, 'base64');

  if (!buffer.length) {
    return { error: 'Uploaded image is empty.' };
  }

  if (buffer.length > MAX_FILE_SIZE_BYTES) {
    return { error: 'Image must be 5 MB or smaller.' };
  }

  return { buffer };
};

const saveImageFile = ({ directory, mimeType, buffer, prefix }) => {
  const extension = getExtensionFromMimeType(mimeType);
  const fileName = `${prefix}-${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;
  const absolutePath = path.join(directory, fileName);

  fs.writeFileSync(absolutePath, buffer);

  return fileName;
};

router.post('/profile-image', authenticate, async (req, res) => {
  try {
    const { base64Data, mimeType } = req.body;
    const decoded = decodeImagePayload({ base64Data, mimeType });

    if (decoded.error) {
      return res.status(400).json({
        success: false,
        error: decoded.error,
      });
    }

    const fileName = saveImageFile({
      directory: profileUploadsDir,
      mimeType,
      buffer: decoded.buffer,
      prefix: `profile-${req.userId}`,
    });

    const relativePath = `/uploads/profiles/${fileName}`;
    const profileImageUrl = buildPublicUrl(req, relativePath);
    const user = await User.findByPk(req.userId);

    await user.update({ profile_image_url: profileImageUrl });

    res.json({
      success: true,
      data: {
        profile_image_url: profileImageUrl,
        user: user.toSafeObject(),
      },
      message: 'Profile image uploaded successfully.',
    });
  } catch (error) {
    console.error('Profile image upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload profile image.',
    });
  }
});

router.post('/offer-item-image', authenticate, async (req, res) => {
  try {
    const { base64Data, mimeType } = req.body;
    const decoded = decodeImagePayload({ base64Data, mimeType });

    if (decoded.error) {
      return res.status(400).json({
        success: false,
        error: decoded.error,
      });
    }

    const fileName = saveImageFile({
      directory: offerUploadsDir,
      mimeType,
      buffer: decoded.buffer,
      prefix: `offer-item-${req.userId}`,
    });

    const relativePath = `/uploads/offers/${fileName}`;
    const imageUrl = buildPublicUrl(req, relativePath);

    res.json({
      success: true,
      data: {
        image_url: imageUrl,
      },
      message: 'Offer item image uploaded successfully.',
    });
  } catch (error) {
    console.error('Offer item image upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload offer item image.',
    });
  }
});

export default router;

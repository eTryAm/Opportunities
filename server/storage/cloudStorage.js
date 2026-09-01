import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import multer from 'multer';
import config from '../config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configure Cloudinary if credentials are present
const isCloudinaryConfigured = Boolean(
  config.cloudinaryCloudName && config.cloudinaryApiKey && config.cloudinaryApiSecret
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: config.cloudinaryCloudName,
    api_key: config.cloudinaryApiKey,
    api_secret: config.cloudinaryApiSecret,
    secure: true,
  });
}

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype.toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG and WebP images are allowed.'), false);
    }
  },
});

/**
 * Uploads a community member photo to Cloudinary (in production) or local disk (in development fallback).
 * @param {Buffer} fileBuffer
 * @param {string} originalname
 * @param {string} mimetype
 * @returns {Promise<{ url: string, storageType: 'cloudinary' | 'local', publicId?: string }>}
 */
export async function uploadCommunityPhoto(fileBuffer, originalname, mimetype) {
  if (!fileBuffer || fileBuffer.length === 0) {
    throw new Error('No image buffer provided for upload.');
  }

  if (fileBuffer.length > MAX_FILE_SIZE) {
    throw new Error('Image exceeds the maximum allowed size of 5MB.');
  }

  if (!ALLOWED_MIME_TYPES.includes(mimetype.toLowerCase())) {
    throw new Error('Invalid image format. Only JPEG, PNG, and WebP are allowed.');
  }

  // 1. Cloudinary upload if configured
  if (isCloudinaryConfigured) {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'yeh_community_photos',
          resource_type: 'image',
          allowed_formats: ['jpg', 'png', 'webp', 'jpeg'],
          transformation: [
            { width: 600, height: 600, crop: 'limit', quality: 'auto:good' },
          ],
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            return reject(new Error('Failed to upload image to cloud storage.'));
          }
          resolve({
            url: result.secure_url,
            storageType: 'cloudinary',
            publicId: result.public_id,
          });
        }
      );
      uploadStream.end(fileBuffer);
    });
  }

  // 2. Local disk fallback (development)
  const localDir = path.resolve(__dirname, '../uploads/community_photos');
  if (!fs.existsSync(localDir)) {
    fs.mkdirSync(localDir, { recursive: true });
  }

  const ext = path.extname(originalname) || (mimetype === 'image/png' ? '.png' : '.jpg');
  const safeFilename = `photo-${Date.now()}-${crypto.randomBytes(4).toString('hex')}${ext}`;
  const filePath = path.join(localDir, safeFilename);

  await fs.promises.writeFile(filePath, fileBuffer);

  return {
    url: `/uploads/community_photos/${safeFilename}`,
    storageType: 'local',
    publicId: safeFilename,
  };
}

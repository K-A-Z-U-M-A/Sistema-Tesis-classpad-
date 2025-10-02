import multer from 'multer';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { v4 as uuidv4 } from 'uuid';

/**
 * Enhanced Storage Service for ClassPad
 * Handles file uploads with improved security and organization
 */

// Configure multer storage with better organization
const uploadsDir = join(process.cwd(), 'public', 'uploads');
const materialsDir = join(uploadsDir, 'materials');
const assignmentsDir = join(uploadsDir, 'assignments');

// Ensure directories exist
[uploadsDir, materialsDir, assignmentsDir].forEach(dir => {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
});

// Enhanced storage configuration
const createStorage = (subDir) => multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, subDir);
  },
  filename: (req, file, cb) => {
    // Generate secure filename with UUID
    const uniqueId = uuidv4();
    const extension = file.originalname.split('.').pop()?.toLowerCase() || '';
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${uniqueId}-${sanitizedName}`;
    cb(null, filename);
  }
});

// File type validation
const getAllowedMimeTypes = () => [
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
  // Images
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  // Videos
  'video/mp4',
  'video/avi',
  'video/mov',
  'video/wmv',
  'video/webm',
  'video/quicktime',
  // Audio
  'audio/mpeg',
  'audio/wav',
  'audio/ogg',
  'audio/mp3',
  'audio/mp4',
  // Archives
  'application/zip',
  'application/x-rar-compressed',
  'application/x-7z-compressed'
];

// Enhanced multer configuration
export const upload = multer({ 
  storage: createStorage(materialsDir),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = getAllowedMimeTypes();
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}`), false);
    }
  }
});

// Assignment-specific upload
export const uploadAssignment = multer({ 
  storage: createStorage(assignmentsDir),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = getAllowedMimeTypes();
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}`), false);
    }
  }
});

/**
 * Generate public URL for uploaded file
 * @param {string} filename - The uploaded filename
 * @param {string} type - Type of file ('materials' or 'assignments')
 * @returns {string} - Public URL
 */
export function generatePublicUrl(filename, type = "materials") {
  const baseUrl = process.env.PUBLIC_BASE_URL || "http://localhost:3001";
  return `${baseUrl}/uploads/${type}/${filename}`;
}

/**
 * Get file info for database storage
 * @param {Object} file - Multer file object
 * @param {string} type - Type of file ('materials' or 'assignments')
 * @returns {Object} - File info object
 */
export function getFileInfo(file, type = 'materials') {
  return {
    filename: file.filename,
    originalName: file.originalname,
    size: file.size,
    mimeType: file.mimetype,
    path: file.path,
    publicUrl: generatePublicUrl(file.filename, type)
  };
}

/**
 * Validate file size
 * @param {number} size - File size in bytes
 * @param {number} maxSize - Maximum size in bytes (default: 100MB)
 * @returns {boolean} - Whether file size is valid
 */
export function validateFileSize(size, maxSize = 100 * 1024 * 1024) {
  return size <= maxSize;
}

/**
 * Get material type from MIME type
 * @param {string} mimeType - MIME type of the file
 * @returns {string} - Material type for database
 */
export function getMaterialTypeFromMime(mimeType) {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType === 'application/pdf' || 
      mimeType.includes('document') || 
      mimeType.includes('text/') ||
      mimeType.includes('spreadsheet') ||
      mimeType.includes('presentation')) return 'document';
  return 'document'; // Default fallback
}

/**
 * Check if material type is valid
 * @param {string} type - Material type
 * @returns {boolean} - Whether type is valid
 */
export function isValidMaterialType(type) {
  const validTypes = ['document', 'image', 'video', 'audio', 'link'];
  return validTypes.includes(type);
}

/**
 * Get file extension from filename
 * @param {string} filename - The filename
 * @returns {string} - File extension
 */
export function getFileExtension(filename) {
  return filename.split('.').pop().toLowerCase();
}

/**
 * Check if file type is allowed
 * @param {string} mimeType - MIME type
 * @param {Array} allowedTypes - Array of allowed MIME types
 * @returns {boolean} - Whether file type is allowed
 */
export function isAllowedFileType(mimeType, allowedTypes = []) {
  if (allowedTypes.length === 0) return true;
  return allowedTypes.includes(mimeType);
}

// Future: AWS S3 integration
export class S3Storage {
  constructor() {
    // TODO: Implement S3 storage
    this.bucketName = process.env.S3_BUCKET_NAME;
    this.region = process.env.S3_REGION;
  }

  async uploadFile(file, key) {
    // TODO: Implement S3 upload
    throw new Error('S3 storage not implemented yet');
  }

  async deleteFile(key) {
    // TODO: Implement S3 delete
    throw new Error('S3 storage not implemented yet');
  }

  generatePublicUrl(key) {
    return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;
  }
}

// Future: Google Cloud Storage integration
export class GCSStorage {
  constructor() {
    // TODO: Implement GCS storage
    this.bucketName = process.env.GCS_BUCKET_NAME;
  }

  async uploadFile(file, key) {
    // TODO: Implement GCS upload
    throw new Error('GCS storage not implemented yet');
  }

  async deleteFile(key) {
    // TODO: Implement GCS delete
    throw new Error('GCS storage not implemented yet');
  }

  generatePublicUrl(key) {
    return `https://storage.googleapis.com/${this.bucketName}/${key}`;
  }
}

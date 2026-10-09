const { supabaseAdmin } = require('../config/supabase');

const POSTER_BUCKET = 'club-assets';
const POSTER_FOLDER = 'event-posters';

/**
 * Service to handle uploading, storing, and retrieving event poster images
 * using the Supabase Storage bucket ('club-assets').
 */
class PosterStorageService {
  /**
   * Ensures the storage bucket exists and is public.
   */
  static async ensureBucketExists() {
    try {
      const { data: buckets, error } = await supabaseAdmin.storage.listBuckets();
      if (error) {
        console.warn('[PosterStorageService] Error listing buckets:', error.message);
        return;
      }

      const found = buckets?.some((b) => b.id === POSTER_BUCKET || b.name === POSTER_BUCKET);
      if (!found) {
        console.log(`[PosterStorageService] Bucket '${POSTER_BUCKET}' not found. Creating public bucket...`);
        const { error: createErr } = await supabaseAdmin.storage.createBucket(POSTER_BUCKET, {
          public: true,
        });
        if (createErr) {
          console.warn('[PosterStorageService] Could not create bucket:', createErr.message);
        }
      }
    } catch (err) {
      console.warn('[PosterStorageService] ensureBucketExists error:', err.message);
    }
  }

  /**
   * Generates a safe file extension from MIME type.
   *
   * @param {string} mimeType
   * @returns {string}
   */
  static getExtension(mimeType) {
    switch (mimeType) {
      case 'image/png':
        return 'png';
      case 'image/webp':
        return 'webp';
      case 'image/gif':
        return 'gif';
      case 'image/svg+xml':
        return 'svg';
      case 'image/jpeg':
      case 'image/jpg':
      default:
        return 'jpg';
    }
  }

  /**
   * Uploads an image buffer directly to the storage bucket.
   *
   * @param {Object} params
   * @param {Buffer} params.buffer - File buffer
   * @param {string} params.mimeType - MIME type of image
   * @param {string} [params.eventId] - Optional associated event ID
   * @param {string} [params.originalName] - Optional original filename
   * @returns {Promise<{ publicUrl: string, path: string }>}
   */
  static async uploadPosterBuffer({ buffer, mimeType, eventId = 'general', originalName = null }) {
    if (!buffer || !Buffer.isBuffer(buffer)) {
      throw new Error('Invalid file buffer provided for poster upload.');
    }

    await this.ensureBucketExists();

    const ext = this.getExtension(mimeType);
    const timestamp = Date.now();
    const safeEventId = String(eventId).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 36) || 'event';
    const filePath = `${POSTER_FOLDER}/${safeEventId}_${timestamp}.${ext}`;

    const { data, error } = await supabaseAdmin.storage
      .from(POSTER_BUCKET)
      .upload(filePath, buffer, {
        contentType: mimeType || 'image/jpeg',
        cacheControl: 'public, max-age=31536000, immutable',
        upsert: true,
      });

    if (error) {
      console.error('[PosterStorageService] Storage upload error:', error);
      throw new Error(`Failed to upload poster to storage bucket: ${error.message}`);
    }

    const { data: urlData } = supabaseAdmin.storage
      .from(POSTER_BUCKET)
      .getPublicUrl(filePath);

    return {
      publicUrl: urlData.publicUrl,
      path: filePath,
    };
  }

  /**
   * Safely deletes an existing poster file from Supabase Storage by its public URL or path.
   * Prevents accumulating orphaned banner files when events are updated or deleted.
   *
   * @param {string} urlOrPath
   * @returns {Promise<boolean>}
   */
  static async deletePosterByUrl(urlOrPath) {
    if (!urlOrPath || typeof urlOrPath !== 'string') {
      return false;
    }

    try {
      // Extract storage path from public URL: .../club-assets/event-posters/filename.webp
      let relativePath = null;
      if (urlOrPath.includes(`/${POSTER_BUCKET}/`)) {
        const parts = urlOrPath.split(`/${POSTER_BUCKET}/`);
        if (parts[1]) {
          relativePath = decodeURIComponent(parts[1].split('?')[0]);
        }
      } else if (urlOrPath.includes(`/${POSTER_FOLDER}/`)) {
        const parts = urlOrPath.split(`/${POSTER_FOLDER}/`);
        if (parts[1]) {
          relativePath = `${POSTER_FOLDER}/${decodeURIComponent(parts[1].split('?')[0])}`;
        }
      } else if (urlOrPath.startsWith(`${POSTER_FOLDER}/`)) {
        relativePath = urlOrPath;
      }

      if (!relativePath || !relativePath.startsWith(`${POSTER_FOLDER}/`)) {
        return false;
      }

      const { data, error } = await supabaseAdmin.storage
        .from(POSTER_BUCKET)
        .remove([relativePath]);

      if (error) {
        console.warn(`[PosterStorageService] Could not remove old poster '${relativePath}':`, error.message);
        return false;
      }

      return true;
    } catch (err) {
      console.warn('[PosterStorageService] deletePosterByUrl error:', err.message);
      return false;
    }
  }

  /**
   * Safe Storage Audit & Cleanup tool:
   * Compares all files in the Supabase Storage bucket against active database references.
   *
   * @param {Object} options
   * @param {boolean} [options.dryRun=true] - If true, only reports without deleting
   * @returns {Promise<Object>}
   */
  static async auditStoragePosters({ dryRun = true } = {}) {
    await this.ensureBucketExists();

    // 1. List files in storage bucket under POSTER_FOLDER
    const { data: files, error: listError } = await supabaseAdmin.storage
      .from(POSTER_BUCKET)
      .list(POSTER_FOLDER, { limit: 1000, sortBy: { column: 'created_at', order: 'desc' } });

    if (listError) {
      throw new Error(`Failed to list storage objects: ${listError.message}`);
    }

    // 2. Fetch all active event banner/thumbnail references from PostgreSQL
    const { data: events, error: eventsError } = await supabaseAdmin
      .from('events')
      .select('id, title, details');

    if (eventsError) {
      throw new Error(`Failed to fetch events for storage audit: ${eventsError.message}`);
    }

    const referencedFiles = new Set();
    for (const ev of events || []) {
      const details = ev.details || {};
      const urls = [
        details.banner_url,
        details.thumbnail_url,
        details.coverImage,
        details.cover_image,
      ];
      for (const u of urls) {
        if (u && typeof u === 'string') {
          const match = u.match(/event-posters\/([^?#]+)/);
          if (match && match[1]) {
            referencedFiles.add(match[1]);
          }
        }
      }
    }

    const totalFiles = (files || []).filter((f) => f.name !== '.emptyFolderPlaceholder');
    const totalBytes = totalFiles.reduce((acc, f) => acc + (f.metadata?.size || 0), 0);

    const now = Date.now();
    const twoHoursAgo = now - 2 * 60 * 60 * 1000;

    const orphanedFiles = [];
    let orphanedBytes = 0;

    for (const file of totalFiles) {
      const isReferenced = referencedFiles.has(file.name);
      if (!isReferenced) {
        // Only consider files created at least 2 hours ago as orphaned to prevent race conditions during upload
        const createdMs = file.created_at ? new Date(file.created_at).getTime() : 0;
        if (createdMs < twoHoursAgo || !file.created_at) {
          orphanedFiles.push({
            name: file.name,
            path: `${POSTER_FOLDER}/${file.name}`,
            size: file.metadata?.size || 0,
            created_at: file.created_at,
          });
          orphanedBytes += file.metadata?.size || 0;
        }
      }
    }

    let deletedCount = 0;
    if (!dryRun && orphanedFiles.length > 0) {
      const pathsToDelete = orphanedFiles.map((f) => f.path);
      const { error: removeErr } = await supabaseAdmin.storage
        .from(POSTER_BUCKET)
        .remove(pathsToDelete);

      if (!removeErr) {
        deletedCount = orphanedFiles.length;
      }
    }

    return {
      dryRun,
      totalFilesCount: totalFiles.length,
      totalStorageBytes: totalBytes,
      totalStorageFormatted: `${(totalBytes / (1024 * 1024)).toFixed(2)} MB`,
      referencedFilesCount: referencedFiles.size,
      orphanedFilesCount: orphanedFiles.length,
      orphanedBytes,
      orphanedFormatted: `${(orphanedBytes / (1024 * 1024)).toFixed(2)} MB`,
      deletedCount,
      orphanedFilesSample: orphanedFiles.slice(0, 20),
    };
  }

  /**
   * Detects and converts a Base64 data URI (e.g. 'data:image/jpeg;base64,...')
   * into a file buffer and uploads it to the storage bucket.
   *
   * @param {string} base64String
   * @param {string} [eventId]
   * @returns {Promise<string>} - The public storage URL
   */
  static async uploadBase64Poster(base64String, eventId = 'general') {
    if (!base64String || typeof base64String !== 'string') {
      return base64String;
    }

    // Check if it's actually a base64 data URI
    const match = base64String.match(/^data:([a-zA-Z0-9/+.-]+);base64,(.+)$/);
    if (!match) {
      // If it's already an HTTP / bucket URL, return as-is
      return base64String;
    }

    const mimeType = match[1] || 'image/jpeg';
    const base64Data = match[2];
    const buffer = Buffer.from(base64Data, 'base64');

    const result = await this.uploadPosterBuffer({
      buffer,
      mimeType,
      eventId,
    });

    return result.publicUrl;
  }

  /**
   * Sanitizes an event details object: if banner_url or coverImage is Base64,
   * converts it to a storage bucket URL.
   *
   * @param {Object} details
   * @param {string} [eventId]
   * @returns {Promise<Object>}
   */
  static async sanitizeEventDetails(details, eventId = 'general') {
    if (!details || typeof details !== 'object') {
      return details;
    }

    const updated = { ...details };

    if (updated.banner_url && typeof updated.banner_url === 'string' && updated.banner_url.startsWith('data:')) {
      try {
        console.log(`[PosterStorageService] Converting base64 banner_url for event '${eventId}' to bucket file...`);
        updated.banner_url = await this.uploadBase64Poster(updated.banner_url, eventId);
      } catch (err) {
        console.warn('[PosterStorageService] Failed to convert banner_url base64:', err.message);
      }
    }

    if (updated.coverImage && typeof updated.coverImage === 'string' && updated.coverImage.startsWith('data:')) {
      if (updated.banner_url && !updated.banner_url.startsWith('data:')) {
        updated.coverImage = updated.banner_url;
      } else {
        try {
          updated.coverImage = await this.uploadBase64Poster(updated.coverImage, eventId);
        } catch (err) {
          console.warn('[PosterStorageService] Failed to convert coverImage base64:', err.message);
        }
      }
    }

    return updated;
  }
}

module.exports = PosterStorageService;

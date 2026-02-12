import { uploadAsync } from 'expo-file-system/legacy';
import { logger } from '../utils/logger';

// API base URL - should come from environment config
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

// FileSystemUploadType.MULTIPART = 1
const UPLOAD_TYPE_MULTIPART = 1;

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface PhotoUploadResponse {
  jobId: string;
  estimatedTime?: number;
  queuePosition?: number;
}

class PhotoUploadError extends Error {
  code: string;
  retryable: boolean;

  constructor(code: string, message: string, retryable = false) {
    super(message);
    this.name = 'PhotoUploadError';
    this.code = code;
    this.retryable = retryable;
  }
}

/**
 * Uploads a photo to the import/photo endpoint
 * Note: FileSystem.uploadAsync doesn't support progress tracking,
 * so onProgress will receive 0 at start and 100 at completion
 */
export async function uploadPhoto(
  uri: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<PhotoUploadResponse> {
  // Signal upload started
  onProgress?.({ loaded: 0, total: 100, percentage: 0 });

  try {
    const uploadResult = await uploadAsync(`${API_BASE_URL}/api/import/photo`, uri, {
      uploadType: UPLOAD_TYPE_MULTIPART,
      fieldName: 'image',
      mimeType: 'image/jpeg',
      httpMethod: 'POST',
      headers: {
        Accept: 'application/json',
      },
    });

    // Signal upload completed
    onProgress?.({ loaded: 100, total: 100, percentage: 100 });

    if (uploadResult.status !== 202 && uploadResult.status !== 200) {
      let errorData;
      try {
        errorData = JSON.parse(uploadResult.body);
      } catch {
        errorData = {};
      }

      logger.error('Photo upload failed', undefined, { status: uploadResult.status });

      throw new PhotoUploadError(
        errorData.code || 'UPLOAD_FAILED',
        errorData.message || `Echec de l'envoi (${uploadResult.status})`,
        uploadResult.status >= 500
      );
    }

    const responseData = JSON.parse(uploadResult.body);
    const data = responseData.data || responseData;

    return {
      jobId: data.jobId,
      estimatedTime: data.estimatedTime,
      queuePosition: data.queuePosition,
    };
  } catch (error) {
    if (error instanceof PhotoUploadError) {
      throw error;
    }

    const err = error instanceof Error ? error : new Error('Unknown error');
    logger.error('Photo upload network error', err);

    throw new PhotoUploadError(
      'NETWORK_ERROR',
      "Echec de l'envoi. Verifiez votre connexion.",
      true
    );
  }
}

/**
 * Uploads multiple photos for batch processing.
 *
 * Two-step approach because React Native's fetch/XHR can't reliably
 * send multi-file FormData with native file URIs:
 * 1. Upload each file individually via uploadAsync (native, reliable)
 * 2. Send the server file paths to the batch endpoint via JSON
 */
export async function uploadPhotos(
  uris: string[],
  onProgress?: (progress: UploadProgress) => void
): Promise<PhotoUploadResponse> {
  onProgress?.({ loaded: 0, total: 100, percentage: 0 });

  try {
    // Step 1: Upload each file individually using native uploadAsync
    const paths: string[] = [];

    for (let i = 0; i < uris.length; i++) {
      const uploadResult = await uploadAsync(`${API_BASE_URL}/api/import/upload`, uris[i], {
        uploadType: UPLOAD_TYPE_MULTIPART,
        fieldName: 'image',
        mimeType: 'image/jpeg',
        httpMethod: 'POST',
        headers: { Accept: 'application/json' },
      });

      if (uploadResult.status !== 200) {
        let errorData;
        try {
          errorData = JSON.parse(uploadResult.body);
        } catch {
          errorData = {};
        }
        throw new PhotoUploadError(
          errorData.code || 'UPLOAD_FAILED',
          errorData.message || `Echec de l'envoi de la photo ${i + 1}`,
          uploadResult.status >= 500
        );
      }

      const data = JSON.parse(uploadResult.body);
      paths.push(data.path);

      // Progress: uploading phase is 0-80%
      const percentage = Math.round(((i + 1) / uris.length) * 80);
      onProgress?.({ loaded: i + 1, total: uris.length, percentage });
    }

    // Step 2: Trigger batch processing with the uploaded file paths
    const response = await fetch(`${API_BASE_URL}/api/import/photos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ paths }),
    });

    onProgress?.({ loaded: 100, total: 100, percentage: 100 });

    if (response.status !== 202 && response.status !== 200) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = {};
      }
      throw new PhotoUploadError(
        errorData.code || 'UPLOAD_FAILED',
        errorData.message || `Echec du traitement (${response.status})`,
        response.status >= 500
      );
    }

    const responseData = await response.json();
    const data = responseData.data || responseData;

    return {
      jobId: data.jobId,
      estimatedTime: data.estimatedTime,
      queuePosition: data.queuePosition,
    };
  } catch (error) {
    if (error instanceof PhotoUploadError) {
      throw error;
    }

    const err = error instanceof Error ? error : new Error(String(error ?? 'Unknown error'));
    logger.error('Batch photo upload error', err);

    throw new PhotoUploadError(
      'NETWORK_ERROR',
      "Echec de l'envoi. Verifiez votre connexion.",
      true
    );
  }
}

export { PhotoUploadError };

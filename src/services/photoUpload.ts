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

export { PhotoUploadError };

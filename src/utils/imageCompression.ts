import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';

const PHOTOS_DIR = `${FileSystem.documentDirectory}photos/`;
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const MAX_DIMENSION = 2048;
const JPEG_QUALITY = 0.8;

export interface CompressedImage {
  uri: string;
  width: number;
  height: number;
  fileSize: number;
}

/**
 * Compresses an image to ensure it's under the max file size
 * and has reasonable dimensions for upload.
 */
/**
 * Gets file size from FileInfo, handling the type safely
 */
async function getFileSize(uri: string): Promise<number> {
  const info = await FileSystem.getInfoAsync(uri);
  if (info.exists && 'size' in info) {
    return (info as { size: number }).size;
  }
  return 0;
}

export async function compressImage(uri: string): Promise<CompressedImage> {
  // Convert to JPEG for consistency and initial compression
  let result = await ImageManipulator.manipulateAsync(uri, [], {
    compress: JPEG_QUALITY,
    format: ImageManipulator.SaveFormat.JPEG,
  });

  let fileSize = await getFileSize(result.uri);

  // Check if dimensions need to be reduced
  const maxDim = Math.max(result.width, result.height);
  if (maxDim > MAX_DIMENSION) {
    const scale = MAX_DIMENSION / maxDim;
    const newWidth = Math.round(result.width * scale);
    const newHeight = Math.round(result.height * scale);

    result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: newWidth, height: newHeight } }],
      { compress: JPEG_QUALITY, format: ImageManipulator.SaveFormat.JPEG }
    );

    fileSize = await getFileSize(result.uri);
  }

  // If still too large, reduce quality further
  if (fileSize > MAX_FILE_SIZE) {
    let quality = 0.7;
    while (fileSize > MAX_FILE_SIZE && quality >= 0.3) {
      result = await ImageManipulator.manipulateAsync(
        uri,
        maxDim > MAX_DIMENSION
          ? [
              {
                resize: {
                  width: Math.round(result.width * 0.9),
                  height: Math.round(result.height * 0.9),
                },
              },
            ]
          : [],
        { compress: quality, format: ImageManipulator.SaveFormat.JPEG }
      );

      fileSize = await getFileSize(result.uri);
      quality -= 0.1;
    }
  }

  return {
    uri: result.uri,
    width: result.width,
    height: result.height,
    fileSize,
  };
}

/**
 * Persists an image to documentDirectory/photos/ so it survives
 * cache clears and dev rebuilds.
 * Handles both remote URLs (http/https) and local file URIs.
 */
export async function persistImage(uri: string): Promise<string> {
  const dirInfo = await FileSystem.getInfoAsync(PHOTOS_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(PHOTOS_DIR, { intermediates: true });
  }

  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
  const destination = `${PHOTOS_DIR}${filename}`;

  if (uri.startsWith('http://') || uri.startsWith('https://')) {
    await FileSystem.downloadAsync(uri, destination);
  } else {
    await FileSystem.copyAsync({ from: uri, to: destination });
  }

  return destination;
}

/**
 * Deletes a recipe image file from disk.
 * Accepts both absolute and relative paths.
 */
export async function deleteRecipeImage(photoUri: string | null): Promise<void> {
  if (!photoUri) return;

  const fullPath = resolveImagePath(photoUri);
  if (!fullPath || !fullPath.includes('/photos/')) return;

  try {
    const info = await FileSystem.getInfoAsync(fullPath);
    if (info.exists) {
      await FileSystem.deleteAsync(fullPath, { idempotent: true });
    }
  } catch {
    // Best-effort cleanup
  }
}

/**
 * Converts an absolute photo path to a relative path for DB storage.
 * e.g. "file:///.../{UUID}/Documents/photos/123.jpg" → "photos/123.jpg"
 */
export function toRelativePhotoPath(photoUri: string | null): string | null {
  if (!photoUri) return null;
  const docDir = FileSystem.documentDirectory;
  if (docDir && photoUri.startsWith(docDir)) {
    return photoUri.slice(docDir.length);
  }
  // Already relative or external URL — return as-is
  return photoUri;
}

/**
 * Resolves a relative photo path to an absolute file URI for display.
 * e.g. "photos/123.jpg" → "file:///.../{UUID}/Documents/photos/123.jpg"
 */
export function resolveImagePath(photoUri: string | null): string | null {
  if (!photoUri) return null;
  // Already absolute (file:// or http)
  if (photoUri.startsWith('file://') || photoUri.startsWith('http')) return photoUri;
  // Relative path — prepend documentDirectory
  return `${FileSystem.documentDirectory}${photoUri}`;
}

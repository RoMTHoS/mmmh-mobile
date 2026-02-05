import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';

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

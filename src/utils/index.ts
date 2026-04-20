export { logger } from './logger';
export type { LogLevel, LogContext } from './logger';

export { validateVideoUrl, detectPlatform, isValidUrl, extractHostname } from './validation';
export type { Platform } from './validation';

export { compressImage } from './imageCompression';
export type { CompressedImage } from './imageCompression';

export {
  requestCameraPermission,
  requestMediaLibraryPermission,
  openSettings,
} from './permissions';

export {
  normalizeIngredientName,
  categorizeIngredient,
  aggregateIngredients,
  regenerateShoppingListItems,
} from './ingredientAggregation';

import {
  requestCameraPermission,
  requestMediaLibraryPermission,
  PERMISSION_MESSAGES,
} from '../../src/utils/permissions';
import { Camera } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';

describe('permissions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('requestCameraPermission', () => {
    it('returns true when permission is granted', async () => {
      (Camera.requestCameraPermissionsAsync as jest.Mock).mockResolvedValueOnce({
        status: 'granted',
      });

      const result = await requestCameraPermission();

      expect(result).toBe(true);
    });

    it('returns false when permission is denied', async () => {
      (Camera.requestCameraPermissionsAsync as jest.Mock).mockResolvedValueOnce({
        status: 'denied',
      });

      const result = await requestCameraPermission();

      expect(result).toBe(false);
    });
  });

  describe('requestMediaLibraryPermission', () => {
    it('returns true when permission is granted', async () => {
      (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValueOnce({
        status: 'granted',
      });

      const result = await requestMediaLibraryPermission();

      expect(result).toBe(true);
    });

    it('returns false when permission is denied', async () => {
      (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValueOnce({
        status: 'denied',
      });

      const result = await requestMediaLibraryPermission();

      expect(result).toBe(false);
    });
  });

  describe('PERMISSION_MESSAGES', () => {
    it('has French messages for camera permission', () => {
      expect(PERMISSION_MESSAGES.camera.title).toBe('Acces a la camera refuse');
      expect(PERMISSION_MESSAGES.camera.message).toContain('parametres');
    });

    it('has French messages for media library permission', () => {
      expect(PERMISSION_MESSAGES.mediaLibrary.title).toBe('Acces aux photos refuse');
      expect(PERMISSION_MESSAGES.mediaLibrary.message).toContain('parametres');
    });
  });
});

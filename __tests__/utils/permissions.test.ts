import {
  requestCameraPermission,
  requestMediaLibraryPermission,
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
});

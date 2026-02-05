import { compressImage } from '../../src/utils/imageCompression';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';

describe('compressImage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns compressed image with correct structure', async () => {
    const mockUri = 'file:///test/photo.jpg';

    const result = await compressImage(mockUri);

    expect(result).toHaveProperty('uri');
    expect(result).toHaveProperty('width');
    expect(result).toHaveProperty('height');
    expect(result).toHaveProperty('fileSize');
  });

  it('calls ImageManipulator.manipulateAsync', async () => {
    const mockUri = 'file:///test/photo.jpg';

    await compressImage(mockUri);

    expect(ImageManipulator.manipulateAsync).toHaveBeenCalled();
  });

  it('uses JPEG format for compression', async () => {
    const mockUri = 'file:///test/photo.jpg';

    await compressImage(mockUri);

    expect(ImageManipulator.manipulateAsync).toHaveBeenCalledWith(
      mockUri,
      expect.any(Array),
      expect.objectContaining({
        format: 'jpeg',
      })
    );
  });

  it('checks file size after compression', async () => {
    const mockUri = 'file:///test/photo.jpg';

    await compressImage(mockUri);

    expect(FileSystem.getInfoAsync).toHaveBeenCalled();
  });

  it('returns numeric fileSize', async () => {
    const mockUri = 'file:///test/photo.jpg';

    const result = await compressImage(mockUri);

    expect(typeof result.fileSize).toBe('number');
  });

  it('returns numeric dimensions', async () => {
    const mockUri = 'file:///test/photo.jpg';

    const result = await compressImage(mockUri);

    expect(typeof result.width).toBe('number');
    expect(typeof result.height).toBe('number');
  });
});

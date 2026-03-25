import {
  compressImage,
  persistImage,
  deleteRecipeImage,
  toRelativePhotoPath,
  resolveImagePath,
} from '../../src/utils/imageCompression';
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

describe('persistImage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uses downloadAsync for remote http URLs', async () => {
    const remoteUrl = 'https://cdn.instagram.com/photo.jpg';

    const result = await persistImage(remoteUrl);

    expect(FileSystem.downloadAsync).toHaveBeenCalledWith(
      remoteUrl,
      expect.stringContaining('file:///mock/documents/photos/')
    );
    expect(FileSystem.copyAsync).not.toHaveBeenCalled();
    expect(result).toContain('file:///mock/documents/photos/');
    expect(result).toContain('.jpg');
  });

  it('uses copyAsync for local file URIs', async () => {
    const localUri = 'file:///tmp/camera/photo.jpg';

    const result = await persistImage(localUri);

    expect(FileSystem.copyAsync).toHaveBeenCalledWith({
      from: localUri,
      to: expect.stringContaining('file:///mock/documents/photos/'),
    });
    expect(FileSystem.downloadAsync).not.toHaveBeenCalled();
    expect(result).toContain('file:///mock/documents/photos/');
  });

  it('creates photos directory if it does not exist', async () => {
    (FileSystem.getInfoAsync as jest.Mock).mockResolvedValueOnce({ exists: false });

    await persistImage('file:///tmp/photo.jpg');

    expect(FileSystem.makeDirectoryAsync).toHaveBeenCalledWith(expect.stringContaining('photos/'), {
      intermediates: true,
    });
  });
});

describe('deleteRecipeImage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deletes file when it exists in photos directory', async () => {
    const photoUri = 'file:///mock/documents/photos/123-abc.jpg';

    await deleteRecipeImage(photoUri);

    expect(FileSystem.deleteAsync).toHaveBeenCalledWith(photoUri, { idempotent: true });
  });

  it('does nothing for null photoUri', async () => {
    await deleteRecipeImage(null);

    expect(FileSystem.deleteAsync).not.toHaveBeenCalled();
  });

  it('does nothing for non-photos-directory URI', async () => {
    await deleteRecipeImage('https://cdn.example.com/image.jpg');

    expect(FileSystem.deleteAsync).not.toHaveBeenCalled();
  });

  it('does not throw when file does not exist', async () => {
    (FileSystem.getInfoAsync as jest.Mock).mockResolvedValueOnce({ exists: false });

    await expect(
      deleteRecipeImage('file:///mock/documents/photos/missing.jpg')
    ).resolves.not.toThrow();
  });

  it('resolves relative path before deleting', async () => {
    await deleteRecipeImage('photos/123-abc.jpg');

    expect(FileSystem.deleteAsync).toHaveBeenCalledWith(
      'file:///mock/documents/photos/123-abc.jpg',
      { idempotent: true }
    );
  });
});

describe('toRelativePhotoPath', () => {
  it('strips documentDirectory prefix from absolute path', () => {
    const absolute = 'file:///mock/documents/photos/123-abc.jpg';
    expect(toRelativePhotoPath(absolute)).toBe('photos/123-abc.jpg');
  });

  it('returns null for null input', () => {
    expect(toRelativePhotoPath(null)).toBeNull();
  });

  it('returns path as-is if not under documentDirectory', () => {
    expect(toRelativePhotoPath('https://cdn.example.com/img.jpg')).toBe(
      'https://cdn.example.com/img.jpg'
    );
  });

  it('returns already-relative path as-is', () => {
    expect(toRelativePhotoPath('photos/123.jpg')).toBe('photos/123.jpg');
  });
});

describe('resolveImagePath', () => {
  it('prepends documentDirectory to relative path', () => {
    expect(resolveImagePath('photos/123-abc.jpg')).toBe(
      'file:///mock/documents/photos/123-abc.jpg'
    );
  });

  it('returns null for null input', () => {
    expect(resolveImagePath(null)).toBeNull();
  });

  it('returns absolute file:// path as-is', () => {
    const absolute = 'file:///mock/documents/photos/123.jpg';
    expect(resolveImagePath(absolute)).toBe(absolute);
  });

  it('returns http URL as-is', () => {
    const url = 'https://cdn.example.com/img.jpg';
    expect(resolveImagePath(url)).toBe(url);
  });
});

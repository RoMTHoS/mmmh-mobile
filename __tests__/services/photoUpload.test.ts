import { uploadPhoto, PhotoUploadError } from '../../src/services/photoUpload';
import { uploadAsync } from 'expo-file-system';

describe('uploadPhoto', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uploads photo successfully', async () => {
    const mockUri = 'file:///test/photo.jpg';

    const result = await uploadPhoto(mockUri);

    expect(result).toHaveProperty('jobId');
    expect(result.jobId).toBe('mock-job-id-123');
  });

  it('calls uploadAsync with correct parameters', async () => {
    const mockUri = 'file:///test/photo.jpg';

    await uploadPhoto(mockUri);

    expect(uploadAsync).toHaveBeenCalledWith(
      expect.stringContaining('/api/import/photo'),
      mockUri,
      expect.objectContaining({
        uploadType: 1, // FileSystemUploadType.MULTIPART
        fieldName: 'image',
        mimeType: 'image/jpeg',
        httpMethod: 'POST',
      })
    );
  });

  it('calls progress callback at start and completion', async () => {
    const mockUri = 'file:///test/photo.jpg';
    const mockOnProgress = jest.fn();

    await uploadPhoto(mockUri, mockOnProgress);

    // Should be called at least twice (0% at start, 100% at end)
    expect(mockOnProgress).toHaveBeenCalledWith(expect.objectContaining({ percentage: 0 }));
    expect(mockOnProgress).toHaveBeenCalledWith(expect.objectContaining({ percentage: 100 }));
  });

  it('returns estimatedTime and queuePosition when available', async () => {
    const mockUri = 'file:///test/photo.jpg';

    const result = await uploadPhoto(mockUri);

    expect(result.estimatedTime).toBe(30);
    expect(result.queuePosition).toBe(1);
  });

  it('throws PhotoUploadError on upload failure', async () => {
    const mockUri = 'file:///test/photo.jpg';

    // Mock a failed upload
    (uploadAsync as jest.Mock).mockResolvedValueOnce({
      status: 500,
      body: JSON.stringify({ code: 'SERVER_ERROR', message: 'Internal error' }),
    });

    await expect(uploadPhoto(mockUri)).rejects.toThrow(PhotoUploadError);
  });

  it('marks server errors as retryable', async () => {
    const mockUri = 'file:///test/photo.jpg';

    (uploadAsync as jest.Mock).mockResolvedValueOnce({
      status: 500,
      body: JSON.stringify({ code: 'SERVER_ERROR', message: 'Internal error' }),
    });

    try {
      await uploadPhoto(mockUri);
    } catch (error) {
      expect(error).toBeInstanceOf(PhotoUploadError);
      expect((error as PhotoUploadError).retryable).toBe(true);
    }
  });

  it('handles network errors gracefully', async () => {
    const mockUri = 'file:///test/photo.jpg';

    (uploadAsync as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    await expect(uploadPhoto(mockUri)).rejects.toThrow(PhotoUploadError);
  });
});

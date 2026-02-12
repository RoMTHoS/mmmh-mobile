import { uploadPhotos, PhotoUploadError } from '../../src/services/photoUpload';

// Mock fetch globally for batch upload tests
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('uploadPhotos (batch)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockResolvedValue({
      status: 202,
      json: () =>
        Promise.resolve({
          data: {
            jobId: 'batch-job-123',
            estimatedTime: 60,
            queuePosition: 2,
          },
        }),
    });
  });

  it('uploads multiple photos successfully', async () => {
    const uris = ['file:///p1.jpg', 'file:///p2.jpg', 'file:///p3.jpg'];
    const result = await uploadPhotos(uris);

    expect(result.jobId).toBe('batch-job-123');
    expect(result.estimatedTime).toBe(60);
    expect(result.queuePosition).toBe(2);
  });

  it('calls fetch with correct endpoint and JSON body', async () => {
    const uris = ['file:///p1.jpg', 'file:///p2.jpg'];
    await uploadPhotos(uris);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain('/api/import/photos');
    expect(options.method).toBe('POST');
    expect(options.headers['Content-Type']).toBe('application/json');
    const body = JSON.parse(options.body);
    expect(body.paths).toHaveLength(2);
  });

  it('calls progress callback at start and completion', async () => {
    const uris = ['file:///p1.jpg'];
    const onProgress = jest.fn();

    await uploadPhotos(uris, onProgress);

    expect(onProgress).toHaveBeenCalledWith(expect.objectContaining({ percentage: 0 }));
    expect(onProgress).toHaveBeenCalledWith(expect.objectContaining({ percentage: 100 }));
  });

  it('throws PhotoUploadError on server error', async () => {
    mockFetch.mockResolvedValueOnce({
      status: 500,
      json: () => Promise.resolve({ code: 'SERVER_ERROR', message: 'Failed' }),
    });

    await expect(uploadPhotos(['file:///p1.jpg'])).rejects.toThrow(PhotoUploadError);
  });

  it('throws PhotoUploadError on network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    await expect(uploadPhotos(['file:///p1.jpg'])).rejects.toThrow(PhotoUploadError);
  });
});

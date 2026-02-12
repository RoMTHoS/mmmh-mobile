import { renderHook, act } from '@testing-library/react-native';
import { usePhotoBatch, MAX_PHOTOS } from '../../src/hooks/usePhotoBatch';

describe('usePhotoBatch', () => {
  it('starts with empty photos array', () => {
    const { result } = renderHook(() => usePhotoBatch());
    expect(result.current.photos).toEqual([]);
    expect(result.current.activeIndex).toBe(0);
    expect(result.current.activePhoto).toBeNull();
  });

  it('adds a photo to the batch', () => {
    const { result } = renderHook(() => usePhotoBatch());

    act(() => {
      result.current.addPhoto('file:///photo1.jpg');
    });

    expect(result.current.photos).toHaveLength(1);
    expect(result.current.photos[0].uri).toBe('file:///photo1.jpg');
    expect(result.current.photos[0].rotation).toBe(0);
  });

  it('adds multiple photos at once', () => {
    const { result } = renderHook(() => usePhotoBatch());

    act(() => {
      result.current.addPhotos(['file:///photo1.jpg', 'file:///photo2.jpg', 'file:///photo3.jpg']);
    });

    expect(result.current.photos).toHaveLength(3);
  });

  it('enforces MAX_PHOTOS limit on addPhoto', () => {
    const { result } = renderHook(() => usePhotoBatch());

    act(() => {
      for (let i = 0; i < MAX_PHOTOS + 2; i++) {
        result.current.addPhoto(`file:///photo${i}.jpg`);
      }
    });

    expect(result.current.photos).toHaveLength(MAX_PHOTOS);
    expect(result.current.canAddMore).toBe(false);
  });

  it('truncates addPhotos to remaining slots', () => {
    const { result } = renderHook(() => usePhotoBatch());

    act(() => {
      result.current.addPhotos(['file:///p1.jpg', 'file:///p2.jpg', 'file:///p3.jpg']);
    });

    act(() => {
      result.current.addPhotos([
        'file:///p4.jpg',
        'file:///p5.jpg',
        'file:///p6.jpg',
        'file:///p7.jpg',
      ]);
    });

    expect(result.current.photos).toHaveLength(MAX_PHOTOS);
  });

  it('removes a photo by index', () => {
    const { result } = renderHook(() => usePhotoBatch());

    act(() => {
      result.current.addPhotos(['file:///p1.jpg', 'file:///p2.jpg', 'file:///p3.jpg']);
    });

    act(() => {
      result.current.removePhoto(1);
    });

    expect(result.current.photos).toHaveLength(2);
    expect(result.current.photos[0].uri).toBe('file:///p1.jpg');
    expect(result.current.photos[1].uri).toBe('file:///p3.jpg');
  });

  it('reorders photos', () => {
    const { result } = renderHook(() => usePhotoBatch());

    act(() => {
      result.current.addPhotos(['file:///p1.jpg', 'file:///p2.jpg', 'file:///p3.jpg']);
    });

    act(() => {
      result.current.reorderPhotos(0, 2);
    });

    expect(result.current.photos[0].uri).toBe('file:///p2.jpg');
    expect(result.current.photos[1].uri).toBe('file:///p3.jpg');
    expect(result.current.photos[2].uri).toBe('file:///p1.jpg');
  });

  it('selects a photo by index', () => {
    const { result } = renderHook(() => usePhotoBatch());

    act(() => {
      result.current.addPhotos(['file:///p1.jpg', 'file:///p2.jpg', 'file:///p3.jpg']);
    });

    act(() => {
      result.current.selectPhoto(2);
    });

    expect(result.current.activeIndex).toBe(2);
    expect(result.current.activePhoto?.uri).toBe('file:///p3.jpg');
  });

  it('returns remainingSlots correctly', () => {
    const { result } = renderHook(() => usePhotoBatch());

    expect(result.current.remainingSlots).toBe(MAX_PHOTOS);

    act(() => {
      result.current.addPhotos(['file:///p1.jpg', 'file:///p2.jpg']);
    });

    expect(result.current.remainingSlots).toBe(MAX_PHOTOS - 2);
  });

  it('canAddMore is false at limit', () => {
    const { result } = renderHook(() => usePhotoBatch());

    act(() => {
      for (let i = 0; i < MAX_PHOTOS; i++) {
        result.current.addPhoto(`file:///p${i}.jpg`);
      }
    });

    expect(result.current.canAddMore).toBe(false);
    expect(result.current.remainingSlots).toBe(0);
  });

  it('rotateActive calls manipulate function', async () => {
    const { result } = renderHook(() => usePhotoBatch());

    act(() => {
      result.current.addPhoto('file:///original.jpg');
    });

    const mockManipulate = jest.fn().mockResolvedValue('file:///rotated.jpg');

    await act(async () => {
      await result.current.rotateActive(mockManipulate);
    });

    expect(mockManipulate).toHaveBeenCalledWith('file:///original.jpg', 90);
    expect(result.current.photos[0].uri).toBe('file:///rotated.jpg');
    expect(result.current.photos[0].rotation).toBe(90);
  });
});

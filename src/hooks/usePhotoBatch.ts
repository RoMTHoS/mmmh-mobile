import { useState, useCallback } from 'react';

export const MAX_PHOTOS = 5;

export interface BatchPhoto {
  uri: string;
  rotation: number;
}

export interface PhotoBatchState {
  photos: BatchPhoto[];
  activeIndex: number;
}

export function usePhotoBatch() {
  const [photos, setPhotos] = useState<BatchPhoto[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  const addPhoto = useCallback(
    (uri: string) => {
      setPhotos((prev) => {
        if (prev.length >= MAX_PHOTOS) return prev;
        const next = [...prev, { uri, rotation: 0 }];
        return next;
      });
      setActiveIndex((prev) => (photos.length < MAX_PHOTOS ? photos.length : prev));
    },
    [photos.length]
  );

  const addPhotos = useCallback(
    (uris: string[]) => {
      setPhotos((prev) => {
        const remaining = MAX_PHOTOS - prev.length;
        const toAdd = uris.slice(0, remaining).map((uri) => ({ uri, rotation: 0 }));
        const next = [...prev, ...toAdd];
        return next;
      });
      setActiveIndex((prev) => {
        const remaining = MAX_PHOTOS - photos.length;
        const added = Math.min(uris.length, remaining);
        return added > 0 ? photos.length : prev;
      });
    },
    [photos.length]
  );

  const removePhoto = useCallback(
    (index: number) => {
      setPhotos((prev) => {
        if (index < 0 || index >= prev.length) return prev;
        return prev.filter((_, i) => i !== index);
      });
      setActiveIndex((prev) => {
        if (prev >= photos.length - 1) {
          return Math.max(0, photos.length - 2);
        }
        if (index < prev) {
          return prev - 1;
        }
        return prev;
      });
    },
    [photos.length]
  );

  const reorderPhotos = useCallback((from: number, to: number) => {
    setPhotos((prev) => {
      if (from < 0 || from >= prev.length || to < 0 || to >= prev.length) return prev;
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
    setActiveIndex((prev) => {
      if (prev === from) return to;
      if (from < prev && to >= prev) return prev - 1;
      if (from > prev && to <= prev) return prev + 1;
      return prev;
    });
  }, []);

  const rotateActive = useCallback(
    async (manipulate: (uri: string, rotation: number) => Promise<string>) => {
      const photo = photos[activeIndex];
      if (!photo) return;

      const newRotation = (photo.rotation + 90) % 360;
      const newUri = await manipulate(photo.uri, newRotation);

      setPhotos((prev) => {
        const next = [...prev];
        next[activeIndex] = { ...next[activeIndex], rotation: newRotation, uri: newUri };
        return next;
      });
    },
    [photos, activeIndex]
  );

  const selectPhoto = useCallback(
    (index: number) => {
      if (index >= 0 && index < photos.length) {
        setActiveIndex(index);
      }
    },
    [photos.length]
  );

  const activePhoto = photos[activeIndex] ?? null;
  const canAddMore = photos.length < MAX_PHOTOS;
  const remainingSlots = MAX_PHOTOS - photos.length;

  return {
    photos,
    activeIndex,
    activePhoto,
    canAddMore,
    remainingSlots,
    addPhoto,
    addPhotos,
    removePhoto,
    reorderPhotos,
    rotateActive,
    selectPhoto,
  };
}

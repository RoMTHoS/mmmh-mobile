import { useCallback } from 'react';
import { View, Text, Image, StyleSheet, Pressable, Alert } from 'react-native';
import { Icon } from '../ui';
import { PhotoBatchStrip } from './PhotoBatchStrip';
import { colors, spacing, radius, fonts } from '../../theme';
import type { BatchPhoto } from '../../hooks/usePhotoBatch';

interface PhotoEditorProps {
  uri: string;
  photos: BatchPhoto[];
  activeIndex: number;
  canAddMore: boolean;
  onComplete: () => void;
  onSelectPhoto: (index: number) => void;
  onRemovePhoto: (index: number) => void;
  onReorderPhotos: (from: number, to: number) => void;
  onAddMore: (source: 'camera' | 'gallery') => void;
}

export function PhotoEditor({
  uri,
  photos,
  activeIndex,
  canAddMore,
  onComplete,
  onSelectPhoto,
  onRemovePhoto,
  onReorderPhotos,
  onAddMore,
}: PhotoEditorProps) {
  const handleAddPhoto = useCallback(() => {
    if (!canAddMore) {
      Alert.alert('Maximum 5 photos', `Vous avez atteint la limite de 5 photos par import.`);
      return;
    }

    Alert.alert('Ajouter une photo', undefined, [
      { text: 'Prendre une photo', onPress: () => onAddMore('camera') },
      { text: 'Choisir dans la galerie', onPress: () => onAddMore('gallery') },
      { text: 'Annuler', style: 'cancel' },
    ]);
  }, [canAddMore, onAddMore]);

  const photoCount = photos.length;
  const importLabel = photoCount > 1 ? `Importer (${photoCount} photos)` : 'Importer';

  return (
    <View style={styles.container}>
      {/* Thumbnail strip - only shown when >1 photo */}
      {photoCount > 1 && (
        <PhotoBatchStrip
          photos={photos}
          activeIndex={activeIndex}
          onSelect={onSelectPhoto}
          onRemove={onRemovePhoto}
          onReorder={onReorderPhotos}
        />
      )}

      {/* Image preview */}
      <View style={styles.imageContainer}>
        <Image source={{ uri }} style={styles.image} resizeMode="contain" />
      </View>

      {/* Bottom buttons */}
      <View style={styles.bottomContainer}>
        <Pressable
          style={({ pressed }) => [
            styles.addPhotoButton,
            pressed && styles.addPhotoButtonPressed,
            !canAddMore && styles.addPhotoButtonDisabled,
          ]}
          onPress={handleAddPhoto}
          disabled={!canAddMore}
        >
          <Icon name="plus" size="sm" color={canAddMore ? colors.accent : colors.textMuted} />
          <Text
            style={[styles.addPhotoButtonText, !canAddMore && styles.addPhotoButtonTextDisabled]}
          >
            {canAddMore ? 'Ajouter une photo' : 'Maximum 5 photos'}
          </Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.importButton, pressed && styles.importButtonPressed]}
          onPress={onComplete}
        >
          <Text style={styles.importButtonText}>{importLabel}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  imageContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  bottomContainer: {
    padding: spacing.lg,
    gap: spacing.sm,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  addPhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.accent,
    backgroundColor: 'transparent',
  },
  addPhotoButtonPressed: {
    backgroundColor: colors.surface,
  },
  addPhotoButtonDisabled: {
    opacity: 0.5,
    borderColor: colors.textMuted,
  },
  addPhotoButtonText: {
    fontFamily: fonts.script,
    fontSize: 18,
    color: colors.accent,
  },
  addPhotoButtonTextDisabled: {
    color: colors.textMuted,
  },
  importButton: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    alignItems: 'center',
  },
  importButtonPressed: {
    backgroundColor: colors.accentLight,
  },
  importButtonText: {
    fontFamily: fonts.script,
    fontSize: 18,
    color: '#FFFFFF',
  },
});

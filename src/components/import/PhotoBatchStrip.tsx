import { useRef, useCallback } from 'react';
import { View, Text, Image, StyleSheet, Pressable, FlatList } from 'react-native';
import { Icon } from '../ui';
import { colors, spacing, fonts } from '../../theme';
import type { BatchPhoto } from '../../hooks/usePhotoBatch';

const THUMBNAIL_SIZE = 60;
const THUMBNAIL_GAP = 8;

interface PhotoBatchStripProps {
  photos: BatchPhoto[];
  activeIndex: number;
  onSelect: (index: number) => void;
  onRemove: (index: number) => void;
  onReorder: (from: number, to: number) => void;
}

export function PhotoBatchStrip({ photos, activeIndex, onSelect, onRemove }: PhotoBatchStripProps) {
  const flatListRef = useRef<FlatList>(null);

  const renderThumbnail = useCallback(
    ({ item, index }: { item: BatchPhoto; index: number }) => {
      const isActive = index === activeIndex;

      return (
        <Pressable
          style={[styles.thumbnailContainer, isActive && styles.thumbnailActive]}
          onPress={() => onSelect(index)}
        >
          <Image source={{ uri: item.uri }} style={styles.thumbnail} />
          <View style={styles.badgeContainer}>
            <Text style={styles.badgeText}>{index + 1}</Text>
          </View>
          <Pressable style={styles.removeButton} onPress={() => onRemove(index)} hitSlop={4}>
            <Icon name="close" size={10} color="#FFFFFF" />
          </Pressable>
        </Pressable>
      );
    },
    [activeIndex, onSelect, onRemove]
  );

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={photos}
        renderItem={renderThumbnail}
        keyExtractor={(_, index) => `photo-${index}`}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  listContent: {
    paddingHorizontal: spacing.md,
  },
  separator: {
    width: THUMBNAIL_GAP,
  },
  thumbnailContainer: {
    width: THUMBNAIL_SIZE,
    height: THUMBNAIL_SIZE,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbnailActive: {
    borderColor: colors.accent,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  badgeContainer: {
    position: 'absolute',
    bottom: 2,
    left: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontFamily: fonts.script,
    fontSize: 10,
    color: '#FFFFFF',
  },
  removeButton: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../theme';

interface CollectionCardProps {
  id: string;
  name: string;
  images: string[];
  onPress: (id: string) => void;
}

export function CollectionCard({ id, name, images, onPress }: CollectionCardProps) {
  const displayImages = images.slice(0, 4);
  const emptySlots = 4 - displayImages.length;

  return (
    <Pressable
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      onPress={() => onPress(id)}
    >
      <View style={styles.imageGrid}>
        {displayImages.map((uri, index) => (
          <Image key={index} source={{ uri }} style={styles.image} resizeMode="cover" />
        ))}
        {Array.from({ length: emptySlots }).map((_, index) => (
          <View key={`empty-${index}`} style={[styles.image, styles.emptySlot]}>
            <Ionicons name="image-outline" size={20} color={colors.textLight} />
          </View>
        ))}
      </View>
      <Text style={styles.name} numberOfLines={1}>
        {name}
      </Text>
    </Pressable>
  );
}

interface NewCollectionCardProps {
  onPress: () => void;
}

export function NewCollectionCard({ onPress }: NewCollectionCardProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      onPress={onPress}
    >
      <View style={[styles.imageGrid, styles.newCard]}>
        <Ionicons name="add" size={32} color={colors.textMuted} />
      </View>
      <Text style={styles.name}>Nouveau</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '48%',
    marginBottom: spacing.base,
  },
  pressed: {
    opacity: 0.8,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    aspectRatio: 1,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  image: {
    width: '50%',
    height: '50%',
  },
  emptySlot: {
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  newCard: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  name: {
    ...typography.label,
    color: colors.text,
    marginTop: spacing.sm,
  },
});

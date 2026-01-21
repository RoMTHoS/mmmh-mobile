import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { colors, typography, spacing, radius } from '../../theme';
import { Icon } from '../ui';

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
      accessibilityRole="button"
      accessibilityLabel={`Collection ${name}`}
    >
      <View style={styles.imageGrid}>
        {displayImages.map((uri, index) => (
          <Image key={index} source={{ uri }} style={styles.image} resizeMode="cover" />
        ))}
        {Array.from({ length: emptySlots }).map((_, index) => (
          <View key={`empty-${index}`} style={[styles.image, styles.emptySlot]}>
            <Icon name="camera" size="sm" color={colors.textLight} />
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
      accessibilityRole="button"
      accessibilityLabel="Créer une nouvelle collection"
    >
      <View style={[styles.imageGrid, styles.newCard]}>
        <Icon name="plus" size="lg" color={colors.textMuted} />
      </View>
      <Text style={styles.name}>Nouveau</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '48%',
    marginBottom: spacing.md,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    aspectRatio: 1,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  image: {
    width: '50%',
    height: '50%',
  },
  emptySlot: {
    backgroundColor: colors.surfaceAlt,
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
    ...typography.sectionTitle,
    color: colors.text,
    marginTop: spacing.sm,
  },
});

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

  const renderSlot = (index: number) => {
    const uri = displayImages[index];
    if (uri) {
      return <Image key={index} source={{ uri }} style={styles.image} resizeMode="cover" />;
    }
    return (
      <View key={index} style={[styles.image, styles.emptySlot]}>
        <Icon name="camera" size="sm" color={colors.textLight} />
      </View>
    );
  };

  return (
    <Pressable
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      onPress={() => onPress(id)}
      accessibilityRole="button"
      accessibilityLabel={`Collection ${name}`}
    >
      <View style={styles.imageGrid}>
        <View style={styles.imageRow}>
          {renderSlot(0)}
          <View style={styles.verticalSeparator} />
          {renderSlot(1)}
        </View>
        <View style={styles.horizontalSeparator} />
        <View style={styles.imageRow}>
          {renderSlot(2)}
          <View style={styles.verticalSeparator} />
          {renderSlot(3)}
        </View>
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
        <Icon name="plus" size={48} color={colors.text} />
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
    aspectRatio: 1,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  imageRow: {
    flexDirection: 'row',
    flex: 1,
  },
  image: {
    flex: 1,
  },
  verticalSeparator: {
    width: 2,
    backgroundColor: colors.background,
  },
  horizontalSeparator: {
    height: 2,
    backgroundColor: colors.background,
  },
  emptySlot: {
    backgroundColor: colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  newCard: {
    flexDirection: 'column',
    flexWrap: 'nowrap',
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

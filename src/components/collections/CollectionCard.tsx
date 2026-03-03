import { View, Text, Image, Pressable, StyleSheet, Dimensions } from 'react-native';
import { colors, fonts, spacing, radius } from '../../theme';

const SCREEN_WIDTH = Dimensions.get('window').width;
const COLLECTION_CARD_WIDTH = (SCREEN_WIDTH - spacing.md * 2 - spacing.md) / 2.3;
import { Icon } from '../ui';

interface CollectionCardProps {
  id: string;
  name: string;
  images: string[];
  onPress: (id: string) => void;
}

export function CollectionCard({ id, name, images, onPress }: CollectionCardProps) {
  const displayImages = images.slice(0, 3);

  const renderSlot = (index: number, style: object) => {
    const uri = displayImages[index];
    if (uri) {
      return <Image key={index} source={{ uri }} style={style} resizeMode="cover" />;
    }
    return (
      <View key={index} style={[style, styles.emptySlot]}>
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
          {renderSlot(0, styles.imageLeft)}
          <View style={styles.verticalSeparator} />
          <View style={styles.rightColumn}>
            {renderSlot(1, styles.imageRight)}
            <View style={styles.horizontalSeparator} />
            {renderSlot(2, styles.imageRight)}
          </View>
        </View>
        <View style={styles.nameOverlay}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
        </View>
      </View>
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
        <View style={styles.newCardNameOverlay}>
          <Text style={styles.name}>Nouveau</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: COLLECTION_CARD_WIDTH,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
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
    borderColor: '#000',
  },
  imageRow: {
    flexDirection: 'row',
    flex: 1,
  },
  imageLeft: {
    flex: 1,
  },
  rightColumn: {
    flex: 1,
  },
  imageRight: {
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
  nameOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.sm,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: '#000',
  },
  newCardNameOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.sm,
    borderTopWidth: 2,
    borderTopColor: colors.border,
    borderStyle: 'dashed',
  },
  name: {
    fontFamily: fonts.script,
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
  },
});

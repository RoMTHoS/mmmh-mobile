import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { colors, spacing } from '../../theme';
import { CollectionCard, NewCollectionCard } from './CollectionCard';

interface Collection {
  id: string;
  name: string;
  images: string[];
}

interface CollectionSectionProps {
  title: string;
  collections: Collection[];
  onCollectionPress: (id: string) => void;
  onNewPress?: () => void;
  showNewButton?: boolean;
  style?: object;
  cardHeight?: number;
}

export function CollectionSection({
  title,
  collections,
  onCollectionPress,
  onNewPress,
  showNewButton = false,
  style,
  cardHeight,
}: CollectionSectionProps) {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.title}>{title}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {collections.map((collection) => (
          <CollectionCard
            key={collection.id}
            id={collection.id}
            name={collection.name}
            images={collection.images}
            onPress={onCollectionPress}
            cardHeight={cardHeight}
          />
        ))}
        {showNewButton && onNewPress && (
          <NewCollectionCard onPress={onNewPress} cardHeight={cardHeight} />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  title: {
    fontFamily: 'Shanti',
    fontSize: 18,
    lineHeight: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  row: {
    gap: spacing.md,
    paddingRight: spacing.xl,
  },
});

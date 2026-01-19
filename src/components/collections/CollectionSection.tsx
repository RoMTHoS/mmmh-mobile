import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '../../theme';
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
}

export function CollectionSection({
  title,
  collections,
  onCollectionPress,
  onNewPress,
  showNewButton = false,
}: CollectionSectionProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.grid}>
        {collections.map((collection) => (
          <CollectionCard
            key={collection.id}
            id={collection.id}
            name={collection.name}
            images={collection.images}
            onPress={onCollectionPress}
          />
        ))}
        {showNewButton && onNewPress && <NewCollectionCard onPress={onNewPress} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
    fontStyle: 'italic',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
});

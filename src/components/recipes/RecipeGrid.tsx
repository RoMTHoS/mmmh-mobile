import { useState, useCallback } from 'react';
import { FlatList, View, RefreshControl, StyleSheet, LayoutChangeEvent } from 'react-native';
import { router } from 'expo-router';
import type { Recipe } from '../../types';
import { RecipeCard } from './RecipeCard';

interface RecipeGridProps {
  recipes: Recipe[];
  refreshing?: boolean;
  onRefresh?: () => void;
}

const CARD_MIN_WIDTH = 160;
const CARD_MARGIN = 8;
const CONTAINER_PADDING = 8;

export function RecipeGrid({ recipes, refreshing = false, onRefresh }: RecipeGridProps) {
  const [numColumns, setNumColumns] = useState(2);

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    const availableWidth = width - CONTAINER_PADDING * 2;
    const columns = Math.max(
      2,
      Math.min(4, Math.floor(availableWidth / (CARD_MIN_WIDTH + CARD_MARGIN * 2)))
    );
    setNumColumns(columns);
  }, []);

  const handleCardPress = useCallback((recipeId: string) => {
    router.push(`/recipe/${recipeId}`);
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: Recipe }) => (
      <RecipeCard recipe={item} onPress={() => handleCardPress(item.id)} />
    ),
    [handleCardPress]
  );

  const keyExtractor = useCallback((item: Recipe) => item.id, []);

  // Calculate item height for getItemLayout
  // Image aspect ratio 4:3, plus content padding
  const getItemLayout = useCallback(
    (_data: ArrayLike<Recipe> | null | undefined, index: number) => {
      const itemHeight = 200; // Approximate: image + content
      return {
        length: itemHeight,
        offset: itemHeight * Math.floor(index / numColumns),
        index,
      };
    },
    [numColumns]
  );

  return (
    <View style={styles.container} onLayout={handleLayout}>
      <FlatList
        data={recipes}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        numColumns={numColumns}
        key={numColumns} // Force re-render when columns change
        contentContainerStyle={styles.list}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#D97706']}
              tintColor="#D97706"
            />
          ) : undefined
        }
        // Performance optimizations
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={5}
        initialNumToRender={8}
        getItemLayout={getItemLayout}
        testID="recipe-grid"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    padding: CONTAINER_PADDING,
  },
});

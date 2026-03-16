import {
  View,
  Text,
  FlatList,
  SectionList,
  Image,
  Pressable,
  StyleSheet,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRecipes } from '../../src/hooks';
import { SearchBar, Icon, EmptyState } from '../../src/components/ui';
import { ImportStatusList } from '../../src/components/import';
import { BookSelector } from '../../src/components/collections';
import { useCollectionStore } from '../../src/stores/collectionStore';
import { RecipeGridSkeleton } from '../../src/components/recipes/RecipeGridSkeleton';
import { useUIStore } from '../../src/stores/uiStore';
import { colors, spacing, radius, fonts, typography } from '../../src/theme';
import type { Recipe } from '../../src/types';

const NUM_COLUMNS = 3;
const GRID_GAP = spacing.sm;
const SCREEN_WIDTH = Dimensions.get('window').width;
const ITEM_WIDTH = (SCREEN_WIDTH - spacing.md * 2 - GRID_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;

function RecipeGridItem({ recipe, onPress }: { recipe: Recipe; onPress: (r: Recipe) => void }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.gridItem, pressed && styles.gridItemPressed]}
      onPress={() => onPress(recipe)}
      accessibilityRole="button"
      accessibilityLabel={recipe.title}
    >
      {recipe.photoUri ? (
        <Image source={{ uri: recipe.photoUri }} style={styles.gridImage} resizeMode="cover" />
      ) : (
        <View style={[styles.gridImage, styles.gridImagePlaceholder]}>
          <Icon name="camera" size="lg" color={colors.textLight} />
        </View>
      )}
    </Pressable>
  );
}

function MenuRecipeGridItem({
  recipe,
  onPress,
  servings,
  onDecrement,
  onIncrement,
}: {
  recipe: Recipe;
  onPress: (r: Recipe) => void;
  servings: number;
  onDecrement: () => void;
  onIncrement: () => void;
}) {
  return (
    <View style={styles.gridItem}>
      <Pressable
        style={({ pressed }) => [pressed && styles.gridItemPressed]}
        onPress={() => onPress(recipe)}
        accessibilityRole="button"
        accessibilityLabel={recipe.title}
      >
        {recipe.photoUri ? (
          <Image source={{ uri: recipe.photoUri }} style={styles.gridImage} resizeMode="cover" />
        ) : (
          <View style={[styles.gridImage, styles.gridImagePlaceholder]}>
            <Icon name="camera" size="lg" color={colors.textLight} />
          </View>
        )}
      </Pressable>
      <View style={styles.portionStepper}>
        <Pressable
          onPress={onDecrement}
          disabled={servings <= 1}
          hitSlop={4}
          style={styles.stepperButton}
        >
          <Text style={styles.stepperText}>-</Text>
        </Pressable>
        <View style={styles.portionCenter}>
          <Ionicons name="person-outline" size={13} color={colors.text} />
          <Text style={styles.portionValue}>{servings}</Text>
        </View>
        <Pressable onPress={onIncrement} hitSlop={4} style={styles.stepperButton}>
          <Text style={styles.stepperText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

/** Renders a row of up to NUM_COLUMNS items inside a section */
function GridRow({
  items,
  onPress,
  menuId,
  recipeServings,
  onServingsChange,
}: {
  items: Recipe[];
  onPress: (r: Recipe) => void;
  menuId?: string;
  recipeServings?: Record<string, number>;
  onServingsChange?: (recipeId: string, servings: number) => void;
}) {
  return (
    <View style={styles.gridRow}>
      {items.map((recipe) =>
        menuId && recipeServings && onServingsChange ? (
          <MenuRecipeGridItem
            key={recipe.id}
            recipe={recipe}
            onPress={onPress}
            servings={recipeServings[recipe.id] ?? recipe.servings ?? 4}
            onDecrement={() => {
              const curr = recipeServings[recipe.id] ?? recipe.servings ?? 4;
              if (curr > 1) onServingsChange(recipe.id, curr - 1);
            }}
            onIncrement={() => {
              const curr = recipeServings[recipe.id] ?? recipe.servings ?? 4;
              onServingsChange(recipe.id, curr + 1);
            }}
          />
        ) : (
          <RecipeGridItem key={recipe.id} recipe={recipe} onPress={onPress} />
        )
      )}
      {/* Fill empty slots to keep alignment */}
      {items.length < NUM_COLUMNS &&
        Array.from({ length: NUM_COLUMNS - items.length }).map((_, i) => (
          <View key={`empty-${i}`} style={styles.gridItem} />
        ))}
    </View>
  );
}

/** Chunk an array into groups of `size` */
function chunk<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const { bookId } = useLocalSearchParams<{ bookId?: string }>();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);

  useEffect(() => {
    if (bookId !== undefined) {
      setSelectedBookId(bookId || null);
    }
  }, [bookId]);
  const openImportModal = useUIStore((s) => s.openImportModal);
  const { data: recipes, isLoading, error, refetch, isRefetching } = useRecipes();
  const collections = useCollectionStore((s) => s.collections);

  const selectedCollection = useMemo(
    () => (selectedBookId ? collections.find((c) => c.id === selectedBookId) : null),
    [selectedBookId, collections]
  );
  const isMenuView = selectedCollection?.type === 'menu';

  const filteredRecipes = useMemo(() => {
    if (!recipes) return [];

    let result = recipes;

    // Filter by selected collection
    if (selectedBookId) {
      const col = collections.find((c) => c.id === selectedBookId);
      if (col) {
        result = result.filter((r) => col.recipeIds.includes(r.id));
      }
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((r) => {
        const titleMatch = r.title.toLowerCase().includes(query);
        const ingredientMatch = r.ingredients?.some((ing) =>
          ing.name.toLowerCase().includes(query)
        );
        return titleMatch || ingredientMatch;
      });
    }

    return result;
  }, [recipes, searchQuery, selectedBookId, collections]);

  // Group recipes by book for menu view
  const groupedByBook = useMemo(() => {
    if (!isMenuView) return [];

    const recipeBooks = collections.filter((c) => c.type === 'recipeBook');
    const assignedIds = new Set<string>();
    const sections: { title: string; data: Recipe[][] }[] = [];

    for (const book of recipeBooks) {
      const bookRecipes = filteredRecipes.filter((r) => book.recipeIds.includes(r.id));
      if (bookRecipes.length > 0) {
        bookRecipes.forEach((r) => assignedIds.add(r.id));
        sections.push({
          title: book.name,
          data: chunk(bookRecipes, NUM_COLUMNS),
        });
      }
    }

    // Remaining recipes not in any book
    const remaining = filteredRecipes.filter((r) => !assignedIds.has(r.id));
    if (remaining.length > 0) {
      sections.push({
        title: 'Toutes les recettes',
        data: chunk(remaining, NUM_COLUMNS),
      });
    }

    return sections;
  }, [isMenuView, filteredRecipes, collections]);

  const setRecipeServings = useCollectionStore((s) => s.setRecipeServings);

  const handleServingsChange = useCallback(
    (recipeId: string, servings: number) => {
      if (selectedBookId) {
        setRecipeServings(selectedBookId, recipeId, servings);
      }
    },
    [selectedBookId, setRecipeServings]
  );

  const handleRecipePress = (recipe: Recipe) => {
    router.push(`/recipe/${recipe.id}`);
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <SearchBar
          value=""
          onChangeText={() => {}}
          placeholder="Rechercher"
          style={styles.searchBar}
        />
        <RecipeGridSkeleton />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="calories" size="lg" color={colors.error} />
        <Text style={styles.errorText}>Erreur de chargement</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Rechercher"
        style={styles.searchBar}
      />

      <ImportStatusList />

      <BookSelector selectedBookId={selectedBookId} onSelect={setSelectedBookId} />

      {filteredRecipes.length === 0 ? (
        <EmptyState
          icon="search"
          title={searchQuery ? 'Aucune recette trouvée' : 'Aucune recette'}
          description={
            searchQuery
              ? "Essayez avec d'autres mots-clés"
              : 'Importez ou créez votre première recette'
          }
          actionLabel={searchQuery ? undefined : 'Importer une recette'}
          onAction={searchQuery ? undefined : openImportModal}
        />
      ) : isMenuView ? (
        <SectionList
          sections={groupedByBook}
          keyExtractor={(item, index) => `row-${index}-${item.map((r) => r.id).join('-')}`}
          renderSectionHeader={({ section: { title } }) => (
            <Text style={styles.sectionHeader}>{title}</Text>
          )}
          renderItem={({ item }) => (
            <GridRow
              items={item}
              onPress={handleRecipePress}
              menuId={selectedBookId ?? undefined}
              recipeServings={selectedCollection?.recipeServings}
              onServingsChange={handleServingsChange}
            />
          )}
          contentContainerStyle={styles.gridContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.accent}
              colors={[colors.accent]}
            />
          }
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
        />
      ) : (
        <FlatList
          data={filteredRecipes}
          keyExtractor={(item) => item.id}
          numColumns={NUM_COLUMNS}
          contentContainerStyle={styles.gridContent}
          columnWrapperStyle={styles.gridRow}
          renderItem={({ item }) => <RecipeGridItem recipe={item} onPress={handleRecipePress} />}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.accent}
              colors={[colors.accent]}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchBar: {
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  gridContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
  },
  gridRow: {
    flexDirection: 'row',
    gap: GRID_GAP,
    marginBottom: GRID_GAP,
  },
  gridItem: {
    width: ITEM_WIDTH,
  },
  gridItemPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  gridImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  gridImagePlaceholder: {
    backgroundColor: colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  portionStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: spacing.xs,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  stepperButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperText: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.text,
    lineHeight: 16,
  },
  portionCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  portionValue: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.text,
  },
  sectionHeader: {
    ...typography.titleScript,
    color: colors.text,
    fontSize: 18,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  errorText: {
    fontFamily: fonts.script,
    fontSize: 20,
    color: colors.error,
    marginTop: spacing.md,
  },
});

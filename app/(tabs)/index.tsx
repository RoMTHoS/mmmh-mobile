import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useState, useMemo } from 'react';
import { router } from 'expo-router';
import { useRecipes } from '../../src/hooks';
import { LoadingScreen, SearchBar, Icon } from '../../src/components/ui';
import { CollectionSection } from '../../src/components/collections';
import { colors, typography, spacing } from '../../src/theme';

export default function HomeScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: recipes, isLoading, error } = useRecipes();

  // Group recipes into collections based on tags/categories
  // For now, we'll create mock collections using recipe images
  const collections = useMemo(() => {
    if (!recipes || recipes.length === 0) return { recipeBooks: [], menus: [] };

    const recipeImages = recipes.filter((r) => r.photoUri).map((r) => r.photoUri as string);

    // Mock collections - in full implementation, these would come from DB
    const recipeBooks = [
      {
        id: 'all',
        name: 'Toutes les recettes',
        images: recipeImages.slice(0, 4),
      },
      {
        id: 'favorites',
        name: 'Favoris',
        images: recipeImages.slice(0, 4),
      },
    ];

    const menus = [
      {
        id: 'menu-1',
        name: 'Menu semaine',
        images: recipeImages.slice(0, 4),
      },
    ];

    return { recipeBooks, menus };
  }, [recipes]);

  const handleCollectionPress = (id: string) => {
    if (id === 'all') {
      router.push('/(tabs)/search');
    }
    // TODO: Navigate to collection detail
  };

  const handleNewCollection = () => {
    // TODO: Open create collection modal
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="calories" size="lg" color={colors.error} />
        <Text style={styles.errorText}>Erreur de chargement</Text>
        <Text style={styles.errorSubtext}>{error.message}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Rechercher"
        onFocus={() => router.push('/(tabs)/search')}
        style={styles.searchBar}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <CollectionSection
          title="Livre de recette"
          collections={collections.recipeBooks}
          onCollectionPress={handleCollectionPress}
          onNewPress={handleNewCollection}
          showNewButton
        />

        <CollectionSection
          title="Regime & Menu"
          collections={collections.menus}
          onCollectionPress={handleCollectionPress}
          onNewPress={handleNewCollection}
          showNewButton
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchBar: {
    margin: spacing.md,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  errorText: {
    ...typography.titleScript,
    color: colors.error,
    marginTop: spacing.md,
  },
  errorSubtext: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});

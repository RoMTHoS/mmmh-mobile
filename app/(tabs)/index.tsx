import { View, Text, ScrollView, TextInput, StyleSheet } from 'react-native';
import { useState, useMemo } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useRecipes } from '../../src/hooks';
import { LoadingScreen } from '../../src/components/ui';
import { CollectionSection } from '../../src/components/collections';
import { colors, typography, spacing, borderRadius } from '../../src/theme';

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
        name: 'Toute les recettes',
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
        <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
        <Text style={styles.errorText}>Erreur de chargement</Text>
        <Text style={styles.errorSubtext}>{error.message}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher"
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onFocus={() => router.push('/(tabs)/search')}
        />
      </View>

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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    margin: spacing.base,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    height: 44,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    marginLeft: spacing.sm,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.base,
    paddingTop: 0,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing['2xl'],
    backgroundColor: colors.background,
  },
  errorText: {
    ...typography.h3,
    color: colors.error,
    marginTop: spacing.base,
  },
  errorSubtext: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});

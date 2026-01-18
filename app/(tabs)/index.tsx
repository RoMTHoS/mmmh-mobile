import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useRecipes } from '../../src/hooks';
import { LoadingScreen } from '../../src/components/ui';
import { RecipeGrid, EmptyState } from '../../src/components/recipes';

export default function CatalogScreen() {
  const { data: recipes, isLoading, error, refetch, isRefetching } = useRecipes();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
        <Text style={styles.errorText}>Failed to load recipes</Text>
        <Text style={styles.errorSubtext}>{error.message}</Text>
      </View>
    );
  }

  if (!recipes || recipes.length === 0) {
    return (
      <View style={styles.container}>
        <EmptyState />
        <Pressable
          style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
          onPress={() => router.push('/recipe/create')}
          testID="create-recipe-fab"
        >
          <Ionicons name="add" size={28} color="#FFF" />
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <RecipeGrid recipes={recipes} refreshing={isRefetching} onRefresh={refetch} />
      <Pressable
        style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
        onPress={() => router.push('/recipe/create')}
        testID="create-recipe-fab"
      >
        <Ionicons name="add" size={28} color="#FFF" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#EF4444',
    marginTop: 16,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#D97706',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  fabPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.95 }],
  },
});

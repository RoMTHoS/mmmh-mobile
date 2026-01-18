import {
  View,
  Text,
  ScrollView,
  Image,
  StyleSheet,
  Alert,
  ImageSourcePropType,
} from 'react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { useKeepAwake } from 'expo-keep-awake';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useRecipe, useDeleteRecipe } from '../../src/hooks';
import { LoadingScreen, IconButton } from '../../src/components/ui';
import { IngredientList, StepList } from '../../src/components/recipes';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const PLACEHOLDER_IMAGE: ImageSourcePropType = require('../../assets/placeholder-food.png');

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: recipe, isLoading, error } = useRecipe(id);
  const deleteRecipe = useDeleteRecipe();

  // Keep screen awake while viewing recipe (for cooking)
  useKeepAwake();

  const handleDelete = () => {
    if (!recipe) return;

    Alert.alert(
      'Delete Recipe',
      `Are you sure you want to delete "${recipe.title}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteRecipe.mutateAsync(id);
              Toast.show({
                type: 'success',
                text1: 'Recipe deleted',
                visibilityTime: 2000,
              });
              router.replace('/');
            } catch {
              Toast.show({
                type: 'error',
                text1: 'Failed to delete recipe',
              });
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ title: 'Loading...' }} />
        <LoadingScreen />
      </>
    );
  }

  if (error || !recipe) {
    return (
      <>
        <Stack.Screen options={{ title: 'Recipe Not Found' }} />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
          <Text style={styles.errorTitle}>Recipe not found</Text>
          <Text style={styles.errorSubtitle}>
            This recipe may have been deleted or doesn't exist.
          </Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: recipe.title,
          headerRight: () => (
            <View style={styles.headerActions}>
              <IconButton
                icon="pencil"
                onPress={() => router.push(`/recipe/${id}/edit`)}
                accessibilityLabel="Edit recipe"
              />
              <IconButton
                icon="trash-outline"
                onPress={handleDelete}
                color="#EF4444"
                accessibilityLabel="Delete recipe"
              />
            </View>
          ),
        }}
      />
      <ScrollView style={styles.container}>
        {/* Hero Image */}
        <Image
          source={recipe.photoUri ? { uri: recipe.photoUri } : PLACEHOLDER_IMAGE}
          style={styles.heroImage}
          resizeMode="cover"
          testID="recipe-hero-image"
        />

        <View style={styles.content}>
          {/* Title */}
          <Text style={styles.title}>{recipe.title}</Text>

          {/* Metadata Badges */}
          <View style={styles.metadata}>
            {recipe.cookingTime && (
              <View style={styles.metaBadge}>
                <Ionicons name="time-outline" size={16} color="#6B7280" />
                <Text style={styles.metaText}>{recipe.cookingTime} min</Text>
              </View>
            )}
            {recipe.servings && (
              <View style={styles.metaBadge}>
                <Ionicons name="people-outline" size={16} color="#6B7280" />
                <Text style={styles.metaText}>{recipe.servings} servings</Text>
              </View>
            )}
          </View>

          {/* Ingredients Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ingredients</Text>
            <IngredientList ingredients={recipe.ingredients} />
          </View>

          {/* Instructions Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Instructions</Text>
            <StepList steps={recipe.steps} />
          </View>

          {/* Notes Section */}
          {recipe.notes && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Notes</Text>
              <Text style={styles.notes}>{recipe.notes}</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  heroImage: {
    width: '100%',
    height: 250,
    backgroundColor: '#F3F4F6',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  metadata: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  metaText: {
    fontSize: 14,
    color: '#6B7280',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  notes: {
    fontSize: 15,
    color: '#6B7280',
    lineHeight: 22,
    fontStyle: 'italic',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#F9FAFB',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
  },
  errorSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
});

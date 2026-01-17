import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useRecipe, useDeleteRecipe } from '../../src/hooks';
import { LoadingScreen, IconButton } from '../../src/components/ui';

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: recipe, isLoading, error } = useRecipe(id);
  const deleteRecipe = useDeleteRecipe();

  const handleDelete = () => {
    Alert.alert(
      'Delete Recipe',
      'Are you sure you want to delete this recipe? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteRecipe.mutateAsync(id);
              router.back();
            } catch {
              Alert.alert('Error', 'Failed to delete recipe');
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return <LoadingScreen />;
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
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{recipe.title}</Text>
          <View style={styles.meta}>
            {recipe.cookingTime && (
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={16} color="#6B7280" />
                <Text style={styles.metaText}>{recipe.cookingTime} min</Text>
              </View>
            )}
            {recipe.servings && (
              <View style={styles.metaItem}>
                <Ionicons name="people-outline" size={16} color="#6B7280" />
                <Text style={styles.metaText}>{recipe.servings} servings</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ingredients</Text>
          {recipe.ingredients.map((ingredient, index) => (
            <View key={index} style={styles.listItem}>
              <View style={styles.bullet} />
              <Text style={styles.listText}>
                {ingredient.quantity && `${ingredient.quantity} `}
                {ingredient.unit && `${ingredient.unit} `}
                {ingredient.name}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Instructions</Text>
          {recipe.steps.map((step, index) => (
            <View key={index} style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{index + 1}</Text>
              </View>
              <Text style={styles.stepText}>{step.instruction}</Text>
            </View>
          ))}
        </View>

        {recipe.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.notes}>{recipe.notes}</Text>
          </View>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    padding: 16,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  meta: {
    flexDirection: 'row',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 14,
    color: '#6B7280',
  },
  section: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D97706',
    marginTop: 6,
    marginRight: 12,
  },
  listText: {
    flex: 1,
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D97706',
  },
  stepText: {
    flex: 1,
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
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

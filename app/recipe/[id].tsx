import {
  View,
  Text,
  ScrollView,
  Image,
  StyleSheet,
  ImageSourcePropType,
  Pressable,
} from 'react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { useKeepAwake } from 'expo-keep-awake';
import { useRecipe } from '../../src/hooks';
import { LoadingScreen, Badge, Icon } from '../../src/components/ui';
import { IngredientList, StepList } from '../../src/components/recipes';
import { colors, typography, spacing, fonts } from '../../src/theme';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const PLACEHOLDER_IMAGE: ImageSourcePropType = require('../../assets/placeholder-food.png');

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: recipe, isLoading, error } = useRecipe(id);

  // Keep screen awake while viewing recipe (for cooking)
  useKeepAwake();

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
        <Stack.Screen options={{ title: 'Recette introuvable' }} />
        <View style={styles.errorContainer}>
          <Icon name="calories" size="lg" color={colors.error} />
          <Text style={styles.errorTitle}>Recette introuvable</Text>
          <Text style={styles.errorSubtitle}>Cette recette a peut-être été supprimée.</Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: '',
          headerBackVisible: false,
          headerLeft: () => (
            <Pressable
              onPress={() => router.back()}
              hitSlop={8}
              style={styles.headerButton}
              accessibilityLabel="Retour"
            >
              <Icon name="arrow-left" size="lg" color={colors.text} />
            </Pressable>
          ),
          headerRight: () => (
            <Pressable
              onPress={() => router.push(`/recipe/${id}/edit`)}
              hitSlop={8}
              style={styles.headerButton}
              accessibilityLabel="Modifier la recette"
            >
              <Icon name="pencil" size="lg" color={colors.text} />
            </Pressable>
          ),
        }}
      />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
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
            {recipe.cookingTime && <Badge icon="time" value={`${recipe.cookingTime} min`} />}
            {recipe.servings && <Badge icon="servings" value={`${recipe.servings} portions`} />}
          </View>

          {/* Ingredients Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ingrédients</Text>
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

      {/* Bottom Action Bar */}
      <View style={styles.actionBar}>
        <Pressable
          style={styles.actionButton}
          onPress={() => {}}
          accessibilityLabel="Enregistrer la recette"
        >
          <Icon name="bookmark" size="lg" color={colors.text} />
          <Text style={styles.actionText}>Enregistrer</Text>
        </Pressable>
        <Pressable
          style={styles.actionButton}
          onPress={() => {}}
          accessibilityLabel="Ajouter aux courses"
        >
          <Icon name="cart" size="lg" color={colors.text} />
          <Text style={styles.actionText}>Courses</Text>
        </Pressable>
        <Pressable
          style={styles.actionButton}
          onPress={() => {}}
          accessibilityLabel="Partager la recette"
        >
          <Icon name="share" size="lg" color={colors.text} />
          <Text style={styles.actionText}>Partager</Text>
        </Pressable>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroImage: {
    width: '100%',
    height: 280,
    backgroundColor: colors.surfaceAlt,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  title: {
    ...typography.headerScript,
    color: colors.text,
    marginBottom: spacing.md,
  },
  metadata: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.titleScript,
    color: colors.text,
    marginBottom: spacing.md,
  },
  notes: {
    ...typography.body,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.background,
  },
  actionButton: {
    alignItems: 'center',
    gap: spacing.xs,
    minWidth: 80,
    paddingVertical: spacing.sm,
  },
  actionText: {
    fontFamily: fonts.script,
    fontSize: 14,
    color: colors.text,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  errorTitle: {
    ...typography.titleScript,
    color: colors.text,
    marginTop: spacing.md,
  },
  errorSubtitle: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});

import { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  StyleSheet,
  ImageSourcePropType,
  Pressable,
  Modal,
  FlatList,
  TextInput,
  Linking,
} from 'react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { Ionicons } from '@expo/vector-icons';
import { useRecipe, useActiveShoppingList, useShoppingListRecipes } from '../../src/hooks';
import { useShoppingStore } from '../../src/stores/shoppingStore';
import { useCollectionStore } from '../../src/stores/collectionStore';
import { analytics } from '../../src/services/analytics';
import { EVENTS } from '../../src/utils/analyticsEvents';
import { LoadingScreen, Badge, Icon } from '../../src/components/ui';
import { IngredientList, StepList } from '../../src/components/recipes';
import { ServingsSelector } from '../../src/components/shopping';
import { colors, typography, spacing, fonts, radius } from '../../src/theme';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const PLACEHOLDER_IMAGE: ImageSourcePropType = require('../../assets/placeholder-food.png');

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: recipe, isLoading, error } = useRecipe(id);
  const [servingsSelectorVisible, setServingsSelectorVisible] = useState(false);
  const [displayServings, setDisplayServings] = useState<number | null>(null);

  const activeListId = useShoppingStore((s) => s.activeListId);
  const listQuery = useActiveShoppingList();
  const defaultListId = listQuery.data?.id ?? '';
  const listId = activeListId ?? defaultListId;
  const recipesQuery = useShoppingListRecipes(listId);

  const existingEntry = useMemo(
    () => recipesQuery.data?.find((r) => r.recipeId === id) ?? null,
    [recipesQuery.data, id]
  );
  const isInList = existingEntry !== null;

  const collections = useCollectionStore((s) => s.collections);
  const addRecipeToCollection = useCollectionStore((s) => s.addRecipeToCollection);
  const removeRecipeFromCollection = useCollectionStore((s) => s.removeRecipeFromCollection);
  const addCollection = useCollectionStore((s) => s.addCollection);
  const [collectionDropdownVisible, setCollectionDropdownVisible] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newCollectionType, setNewCollectionType] = useState<'recipeBook' | 'menu'>('recipeBook');

  const isInAnyCollection = useMemo(
    () => (id ? collections.some((c) => c.recipeIds.includes(id)) : false),
    [collections, id]
  );

  const toggleCollection = (collectionId: string) => {
    if (!id) return;
    const col = collections.find((c) => c.id === collectionId);
    if (!col) return;
    if (col.recipeIds.includes(id)) {
      removeRecipeFromCollection(collectionId, id);
    } else {
      addRecipeToCollection(collectionId, id);
    }
  };

  // Keep screen awake while viewing recipe (for cooking)
  useEffect(() => {
    activateKeepAwakeAsync().catch(() => {});
    return () => {
      deactivateKeepAwake();
    };
  }, []);

  useEffect(() => {
    if (id) analytics.track(EVENTS.RECIPE_VIEWED, { recipe_id: id });
  }, [id]);

  useEffect(() => {
    if (recipe?.servings) setDisplayServings(recipe.servings);
  }, [recipe?.servings]);

  useEffect(() => {
    if (id) analytics.track(EVENTS.RECIPE_VIEWED, { recipe_id: id });
  }, [id]);

  const baseServings = recipe?.servings ?? null;
  const servings = displayServings ?? baseServings;

  const scaledIngredients = useMemo(() => {
    if (!recipe) return [];
    if (!baseServings || !servings || servings === baseServings) return recipe.ingredients;
    const multiplier = servings / baseServings;
    return recipe.ingredients.map((ing) => {
      if (!ing.quantity) return ing;
      const parsed = parseFloat(ing.quantity.replace(',', '.'));
      if (isNaN(parsed)) return ing;
      const scaled = parsed * multiplier;
      const formatted =
        scaled % 1 === 0 ? String(scaled) : scaled.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
      return { ...ing, quantity: formatted };
    });
  }, [recipe?.ingredients, servings, baseServings]);

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
          headerShadowVisible: false,
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
          headerTitle: () => null,
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
        {/* Title */}
        <Text style={styles.recipeTitle}>{recipe.title}</Text>

        {/* Hero Image */}
        <Image
          source={recipe.photoUri ? { uri: recipe.photoUri } : PLACEHOLDER_IMAGE}
          style={styles.heroImage}
          resizeMode="cover"
          testID="recipe-hero-image"
        />

        {/* Source Creator */}
        {recipe.sourceCreator && (
          <Pressable
            style={styles.sourceRow}
            onPress={() => recipe.sourceUrl && Linking.openURL(recipe.sourceUrl)}
            disabled={!recipe.sourceUrl}
          >
            <Text
              style={[styles.sourceText, recipe.sourceUrl && styles.sourceTextLink]}
              numberOfLines={1}
            >
              {recipe.sourceCreator}
            </Text>
          </Pressable>
        )}

        <View style={styles.content}>
          {/* Author Row */}
          {recipe.author && (
            <View style={styles.authorRow}>
              <View style={styles.authorAvatar}>
                <Icon name="servings" size="sm" color={colors.textMuted} />
              </View>
              <Text style={styles.authorText}>Par {recipe.author}</Text>
            </View>
          )}

          {/* Metadata Badges */}
          <View style={styles.metadata}>
            {recipe.cookingTime && <Badge icon="time" value={`${recipe.cookingTime} mn`} />}
            {(recipe.priceMin || recipe.priceMax) && (
              <Badge
                icon="cost"
                value={
                  recipe.priceMin && recipe.priceMax
                    ? `${recipe.priceMin}-${recipe.priceMax} €`
                    : `${recipe.priceMin ?? recipe.priceMax} €`
                }
              />
            )}
            {recipe.kcal && <Badge icon="calories" value={`${recipe.kcal} kcal`} />}
          </View>

          {/* Ingredients Section */}
          <View style={styles.section}>
            <View style={styles.ingredientsHeader}>
              <Text style={styles.sectionTitle}>Ingrédients</Text>
              {baseServings && servings && (
                <View style={styles.servingsStepper}>
                  <Pressable
                    onPress={() => setDisplayServings(Math.max(1, servings - 1))}
                    accessibilityLabel="Diminuer les portions"
                    hitSlop={4}
                  >
                    <Text style={styles.stepperButtonText}>-</Text>
                  </Pressable>
                  <View style={styles.servingsCenter}>
                    <Ionicons name="person-outline" size={15} color={colors.text} />
                    <Text style={styles.servingsCount}>{servings}</Text>
                  </View>
                  <Pressable
                    onPress={() => setDisplayServings(servings + 1)}
                    accessibilityLabel="Augmenter les portions"
                    hitSlop={4}
                  >
                    <Text style={styles.stepperButtonText}>+</Text>
                  </Pressable>
                </View>
              )}
            </View>
            <IngredientList ingredients={scaledIngredients} />
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

      {recipe && (
        <ServingsSelector
          visible={servingsSelectorVisible}
          onClose={() => setServingsSelectorVisible(false)}
          recipe={recipe}
          listId={listId}
          existingEntry={existingEntry}
        />
      )}

      {/* Collection dropdown */}
      <Modal
        visible={collectionDropdownVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setCollectionDropdownVisible(false);
          setNewCollectionName('');
        }}
      >
        <Pressable
          style={styles.dropdownOverlay}
          onPress={() => {
            setCollectionDropdownVisible(false);
            setNewCollectionName('');
          }}
        >
          <Pressable style={styles.dropdown} onPress={() => {}}>
            <Text style={styles.dropdownTitle}>Ajouter à un catalogue</Text>
            {collections.length > 0 ? (
              <FlatList
                data={collections}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => {
                  const isSelected = id ? item.recipeIds.includes(id) : false;
                  return (
                    <Pressable
                      style={[styles.dropdownItem, isSelected && styles.dropdownItemSelected]}
                      onPress={() => toggleCollection(item.id)}
                    >
                      <Text style={styles.dropdownItemType}>
                        {item.type === 'recipeBook' ? 'Livre' : 'Menu'}
                      </Text>
                      <Text
                        style={[
                          styles.dropdownItemText,
                          isSelected && styles.dropdownItemTextSelected,
                        ]}
                        numberOfLines={1}
                      >
                        {item.name}
                      </Text>
                      {isSelected && <Ionicons name="checkmark" size={18} color={colors.accent} />}
                    </Pressable>
                  );
                }}
              />
            ) : (
              <Text style={styles.dropdownEmpty}>Aucun catalogue créé</Text>
            )}
            <View style={styles.dropdownCreateSection}>
              <TextInput
                style={styles.dropdownCreateInput}
                placeholder="Nouveau catalogue..."
                placeholderTextColor={colors.textMuted}
                value={newCollectionName}
                onChangeText={setNewCollectionName}
                returnKeyType="done"
                blurOnSubmit
              />
              <View style={styles.dropdownTypeRow}>
                <Pressable
                  style={[
                    styles.dropdownTypeButton,
                    newCollectionType === 'recipeBook' && styles.dropdownTypeButtonActive,
                  ]}
                  onPress={() => setNewCollectionType('recipeBook')}
                >
                  <Text
                    style={[
                      styles.dropdownTypeText,
                      newCollectionType === 'recipeBook' && styles.dropdownTypeTextActive,
                    ]}
                  >
                    Livre
                  </Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.dropdownTypeButton,
                    newCollectionType === 'menu' && styles.dropdownTypeButtonActive,
                  ]}
                  onPress={() => setNewCollectionType('menu')}
                >
                  <Text
                    style={[
                      styles.dropdownTypeText,
                      newCollectionType === 'menu' && styles.dropdownTypeTextActive,
                    ]}
                  >
                    Menu
                  </Text>
                </Pressable>
              </View>
              <Pressable
                style={[
                  styles.dropdownCreateFullButton,
                  !newCollectionName.trim() && styles.dropdownCreateButtonDisabled,
                ]}
                onPress={() => {
                  if (newCollectionName.trim() && id) {
                    const col = addCollection(newCollectionName.trim(), newCollectionType);
                    addRecipeToCollection(col.id, id);
                    setNewCollectionName('');
                  }
                }}
                disabled={!newCollectionName.trim()}
              >
                <Text
                  style={[
                    styles.dropdownCreateFullButtonText,
                    !newCollectionName.trim() && { color: colors.textMuted },
                  ]}
                >
                  Créer nouveau catalogue
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Bottom Action Bar */}
      <View style={styles.actionBar}>
        <Pressable
          style={styles.actionButton}
          onPress={() => setServingsSelectorVisible(true)}
          accessibilityLabel="Ajouter aux courses"
          testID="courses-button"
        >
          <Icon name="cart-add" size="lg" color={isInList ? colors.accent : colors.text} />
          <Text style={[styles.actionText, isInList && styles.actionTextActive]}>
            Liste de course
          </Text>
        </Pressable>

        <Pressable
          style={styles.actionButton}
          onPress={() => setCollectionDropdownVisible(true)}
          accessibilityLabel="Ajouter à un catalogue"
          testID="collection-button"
        >
          <Icon name="bookmark" size="lg" color={isInAnyCollection ? colors.accent : colors.text} />
          <Text style={[styles.actionText, isInAnyCollection && styles.actionTextActive]}>
            Catalogue
          </Text>
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
  recipeTitle: {
    fontFamily: fonts.script,
    fontSize: 24,
    color: colors.text,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  heroImage: {
    width: '100%',
    height: 280,
    backgroundColor: colors.surfaceAlt,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  sourceText: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.textMuted,
    flex: 1,
  },
  sourceTextLink: {
    color: colors.accent,
    textDecorationLine: 'underline',
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  authorAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorText: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.textMuted,
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
  ingredientsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.titleScript,
    color: colors.text,
  },
  servingsStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    minWidth: 100,
  },
  stepperButtonText: {
    fontFamily: fonts.sans,
    fontSize: 20,
    color: colors.text,
    lineHeight: 22,
  },
  servingsCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  servingsCount: {
    fontFamily: fonts.sans,
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
  },
  notes: {
    ...typography.body,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
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
  actionTextActive: {
    color: colors.accent,
    fontWeight: '600',
  },
  dropdownOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  dropdown: {
    backgroundColor: colors.modalBackground,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderMedium,
    padding: spacing.md,
    maxHeight: 400,
  },
  dropdownTitle: {
    fontFamily: fonts.script,
    fontSize: 18,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    gap: spacing.sm,
  },
  dropdownItemSelected: {
    backgroundColor: colors.surface,
  },
  dropdownItemType: {
    fontFamily: fonts.sans,
    fontSize: 11,
    color: colors.textMuted,
    minWidth: 36,
  },
  dropdownItemText: {
    ...typography.body,
    color: colors.text,
    flex: 1,
  },
  dropdownItemTextSelected: {
    fontWeight: '600',
  },
  dropdownEmpty: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
  dropdownCreateSection: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  dropdownTypeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  dropdownTypeButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
  },
  dropdownTypeButtonActive: {
    borderWidth: 2,
    borderColor: colors.text,
  },
  dropdownTypeText: {
    fontFamily: fonts.script,
    fontSize: 14,
    color: colors.textMuted,
  },
  dropdownTypeTextActive: {
    color: colors.text,
    fontWeight: '600',
  },
  dropdownCreateInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  dropdownCreateFullButton: {
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.accent,
    backgroundColor: colors.accent,
    alignItems: 'center',
  },
  dropdownCreateFullButtonText: {
    fontFamily: fonts.script,
    fontSize: 14,
    color: colors.surface,
  },
  dropdownCreateButtonDisabled: {
    opacity: 0.4,
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

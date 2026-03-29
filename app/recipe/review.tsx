import { useState, useEffect, useMemo } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  Pressable,
  Modal,
  FlatList,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Toast } from '../../src/utils/toast';

import { useImportStore } from '../../src/stores/importStore';
import { useCreateRecipe } from '../../src/hooks';
import { reviewRecipeSchema, type ReviewRecipeFormData } from '../../src/schemas/review.schema';
import { ReviewRecipeForm, ConfidenceIndicator } from '../../src/components/review';
import { PostImportPrompt } from '../../src/components/import/PostImportPrompt';
import { markFirstImportCompleted } from '../../src/components/feedback/FeedbackPrompt';
import { Text, Button, Icon } from '../../src/components/ui';
import { usePlanStatus, useUserPlan } from '../../src/hooks';
import { canActivateTrial } from '../../src/utils/planStateMachine';
import { colors, typography, spacing, fonts, radius } from '../../src/theme';
import { useCollectionStore } from '../../src/stores/collectionStore';
import { Ionicons } from '@expo/vector-icons';
import type { Ingredient, Step } from '../../src/types';
import { persistImage } from '../../src/utils/imageCompression';
import type { ParsedIngredient } from '../../src/components/recipes/IngredientEditor';
import { ingredientsToText } from '../../src/components/recipes/IngredientEditor';

interface ExtractedRecipe {
  title?: string;
  description?: string;
  ingredients?: Array<{
    name: string;
    quantity?: number | string;
    unit?: string;
    notes?: string;
  }>;
  instructions?: Array<{
    text?: string;
    stepNumber?: number;
    duration?: number;
  }>;
  prepTime?: number;
  cookTime?: number;
  servings?: number;
  thumbnailUrl?: string;
  aiConfidence?: number;
  rawTranscript?: string;
  sourceUrl?: string;
}

export default function RecipeReviewScreen() {
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const { removeJob, getJob } = useImportStore();
  const createRecipe = useCreateRecipe();
  const planStatus = usePlanStatus();
  const { data: userPlan } = useUserPlan();

  const job = getJob(jobId || '');
  const recipe = job?.result as ExtractedRecipe | undefined;

  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [hasAiPhoto, setHasAiPhoto] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [structuredIngredients, setStructuredIngredients] = useState<ParsedIngredient[]>([]);

  const collections = useCollectionStore((s) => s.collections);
  const addRecipeToCollection = useCollectionStore((s) => s.addRecipeToCollection);
  const recipeBooks = useMemo(
    () => collections.filter((c) => c.type === 'recipeBook'),
    [collections]
  );
  const menus = useMemo(() => collections.filter((c) => c.type === 'menu'), [collections]);

  const [selectedBookIds, setSelectedBookIds] = useState<string[]>([]);
  const [selectedMenuIds, setSelectedMenuIds] = useState<string[]>([]);
  const [bookDropdownVisible, setBookDropdownVisible] = useState(false);
  const [menuDropdownVisible, setMenuDropdownVisible] = useState(false);
  const [newBookName, setNewBookName] = useState('');
  const [newMenuName, setNewMenuName] = useState('');
  const addCollection = useCollectionStore((s) => s.addCollection);

  const toggleBookId = (id: string) => {
    setSelectedBookIds((prev) =>
      prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]
    );
  };
  const toggleMenuId = (id: string) => {
    setSelectedMenuIds((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const methods = useForm<ReviewRecipeFormData>({
    resolver: zodResolver(reviewRecipeSchema),
    defaultValues: {
      title: '',
      description: '',
      ingredientsText: '',
      stepsText: '',
      prepTime: null,
      cookTime: null,
      servings: null,
      photoUri: null,
    },
  });

  const {
    formState: { isDirty },
  } = methods;

  // Reset form when recipe data becomes available (after store hydration)
  useEffect(() => {
    if (recipe && !isHydrated) {
      methods.reset(mapRecipeToForm(recipe));
      setStructuredIngredients(extractStructuredIngredients(recipe));
      setPhotoUri(recipe.thumbnailUrl || null);
      setHasAiPhoto(!!recipe.thumbnailUrl);
      setIsHydrated(true);
    }
  }, [recipe, isHydrated, methods]);

  if (!jobId) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>ID de job manquant</Text>
        <Button title="Retour" onPress={() => router.back()} />
      </View>
    );
  }

  if (!job || !recipe) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Recette non trouvee. Elle a peut-etre expire.</Text>
        <Button title="Retour" onPress={() => router.back()} />
      </View>
    );
  }

  const handleIngredientsChange = (updated: ParsedIngredient[]) => {
    setStructuredIngredients(updated);
    methods.setValue('ingredientsText', ingredientsToText(updated), {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const ingredientsFromStructured = (): Ingredient[] => {
    return structuredIngredients
      .filter((i) => i.name.trim())
      .map((i) => ({
        name: i.name.trim(),
        quantity: i.quantity.trim() || null,
        unit: i.unit.trim() || null,
      }));
  };

  const parseSteps = (text: string): Step[] => {
    return text
      .split('\n')
      .filter((line) => line.trim())
      .map((line, index) => ({
        order: index + 1,
        instruction: line.trim(),
      }));
  };

  const handleSave = async (data: ReviewRecipeFormData) => {
    try {
      // Extract source creator from rawTranscript metadata (video imports)
      let sourceCreator: string | null = null;
      if (recipe?.rawTranscript) {
        try {
          const parsed = JSON.parse(recipe.rawTranscript);
          sourceCreator = parsed?.metadata?.videoUploader || null;
        } catch {
          // rawTranscript is plain text, not JSON — no creator to extract
        }
      }

      // Persist photo locally if it's a remote URL or temp cache path
      let finalPhotoUri = photoUri;
      if (photoUri && !photoUri.includes('/photos/')) {
        try {
          finalPhotoUri = await persistImage(photoUri);
        } catch {
          // If persistence fails, keep original URI
        }
      }

      const newRecipe = await createRecipe.mutateAsync({
        title: data.title,
        ingredients: ingredientsFromStructured(),
        steps: parseSteps(data.stepsText),
        cookingTime: data.cookTime ?? data.prepTime ?? null,
        servings: data.servings ?? null,
        notes: data.description || null,
        photoUri: finalPhotoUri,
        sourceUrl: job?.sourceUrl || recipe?.sourceUrl || null,
        sourceCreator,
      });

      // Add to selected collections
      const defaultServings = data.servings ?? 4;
      selectedBookIds.forEach((bookId) =>
        addRecipeToCollection(bookId, newRecipe.id, defaultServings)
      );
      selectedMenuIds.forEach((menuId) =>
        addRecipeToCollection(menuId, newRecipe.id, defaultServings)
      );

      // Remove job from store after successful save
      removeJob(jobId);
      markFirstImportCompleted();

      Toast.show({
        type: 'success',
        text1: 'Recette enregistree!',
        text2: 'Votre recette a ete ajoutee au catalogue',
        visibilityTime: 2000,
      });

      // Navigate to the new recipe
      router.replace(`/recipe/${newRecipe.id}`);
    } catch {
      Toast.show({
        type: 'error',
        text1: 'Erreur de sauvegarde',
        text2: 'Veuillez reessayer',
      });
    }
  };

  const handleDiscard = () => {
    Alert.alert(
      'Supprimer la recette?',
      'Cette action supprimera la recette importee. Cette action est irreversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            removeJob(jobId);
            Toast.show({
              type: 'info',
              text1: 'Recette supprimee',
            });
            router.back();
          },
        },
      ]
    );
  };

  const handleValidationError = () => {
    Toast.show({
      type: 'error',
      text1: 'Champs invalides',
      text2: 'Verifiez le titre, les ingredients et les etapes',
    });
  };

  const handleCancel = () => {
    if (isDirty) {
      Alert.alert(
        'Modifications non enregistrees',
        'Voulez-vous vraiment quitter? Les modifications seront perdues mais la recette restera accessible depuis limport.',
        [
          { text: 'Continuer', style: 'cancel' },
          { text: 'Quitter', style: 'destructive', onPress: () => router.back() },
        ]
      );
    } else {
      router.back();
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: '',
          headerStyle: { backgroundColor: colors.background },
          headerShadowVisible: false,
          headerLeft: () => (
            <Pressable onPress={handleCancel} hitSlop={8} style={styles.headerButtonContainer}>
              <Icon name="arrow-left" size="lg" color={colors.text} />
            </Pressable>
          ),
          headerTitle: () => (
            <Text style={styles.headerTitle} numberOfLines={1}>
              Vérifier la recette
            </Text>
          ),
        }}
      />
      <FormProvider {...methods}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          automaticallyAdjustKeyboardInsets
        >
          <ConfidenceIndicator confidence={recipe.aiConfidence ?? 0.5} pipeline={job?.pipeline} />

          {job?.pipeline && planStatus && (
            <PostImportPrompt
              pipeline={job.pipeline}
              tier={planStatus.tier}
              canActivateTrial={userPlan ? canActivateTrial(userPlan) : false}
              geminiQuotaRemaining={planStatus.geminiQuotaRemaining}
              sourceUrl={job.sourceUrl}
              importType={job.importType}
            />
          )}

          <ReviewRecipeForm
            photoUri={photoUri}
            onPhotoChange={setPhotoUri}
            hasAiPhoto={hasAiPhoto}
            ingredients={structuredIngredients}
            onIngredientsChange={handleIngredientsChange}
          />

          {/* Collection selectors */}
          <View style={styles.collectionSection}>
            <Text style={styles.collectionSectionTitle}>Livre de recette</Text>
            <Pressable
              style={styles.collectionSelector}
              onPress={() => setBookDropdownVisible(true)}
            >
              <Text style={styles.collectionSelectorText} numberOfLines={1}>
                {selectedBookIds.length > 0
                  ? recipeBooks
                      .filter((b) => selectedBookIds.includes(b.id))
                      .map((b) => b.name)
                      .join(', ')
                  : 'Aucun'}
              </Text>
              <Ionicons name="chevron-down" size={16} color={colors.text} />
            </Pressable>
          </View>

          <View style={styles.collectionSection}>
            <Text style={styles.collectionSectionTitle}>Regime & Menu</Text>
            <Pressable
              style={styles.collectionSelector}
              onPress={() => setMenuDropdownVisible(true)}
            >
              <Text style={styles.collectionSelectorText} numberOfLines={1}>
                {selectedMenuIds.length > 0
                  ? menus
                      .filter((m) => selectedMenuIds.includes(m.id))
                      .map((m) => m.name)
                      .join(', ')
                  : 'Aucun'}
              </Text>
              <Ionicons name="chevron-down" size={16} color={colors.text} />
            </Pressable>
          </View>

          <View style={styles.bottomPadding} />
        </ScrollView>
      </FormProvider>

      {/* Book dropdown */}
      <Modal
        visible={bookDropdownVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setBookDropdownVisible(false);
          setNewBookName('');
        }}
      >
        <Pressable
          style={styles.dropdownOverlay}
          onPress={() => {
            setBookDropdownVisible(false);
            setNewBookName('');
          }}
        >
          <Pressable style={styles.dropdown} onPress={() => {}}>
            <Text style={styles.dropdownTitle}>Livre de recette</Text>
            <FlatList
              data={recipeBooks}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                const isSelected = selectedBookIds.includes(item.id);
                return (
                  <Pressable
                    style={[styles.dropdownItem, isSelected && styles.dropdownItemSelected]}
                    onPress={() => toggleBookId(item.id)}
                  >
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
            <View style={styles.dropdownCreateRow}>
              <TextInput
                style={styles.dropdownCreateInput}
                placeholder="Nouveau livre..."
                placeholderTextColor={colors.textMuted}
                value={newBookName}
                onChangeText={setNewBookName}
                onSubmitEditing={() => {
                  if (newBookName.trim()) {
                    const col = addCollection(newBookName.trim(), 'recipeBook');
                    setSelectedBookIds((prev) => [...prev, col.id]);
                    setNewBookName('');
                  }
                }}
                returnKeyType="done"
              />
              <Pressable
                style={[
                  styles.dropdownCreateButton,
                  !newBookName.trim() && styles.dropdownCreateButtonDisabled,
                ]}
                onPress={() => {
                  if (newBookName.trim()) {
                    const col = addCollection(newBookName.trim(), 'recipeBook');
                    setSelectedBookIds((prev) => [...prev, col.id]);
                    setNewBookName('');
                  }
                }}
                disabled={!newBookName.trim()}
              >
                <Ionicons
                  name="add"
                  size={20}
                  color={newBookName.trim() ? colors.accent : colors.textMuted}
                />
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Menu dropdown */}
      <Modal
        visible={menuDropdownVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setMenuDropdownVisible(false);
          setNewMenuName('');
        }}
      >
        <Pressable
          style={styles.dropdownOverlay}
          onPress={() => {
            setMenuDropdownVisible(false);
            setNewMenuName('');
          }}
        >
          <Pressable style={styles.dropdown} onPress={() => {}}>
            <Text style={styles.dropdownTitle}>Regime & Menu</Text>
            <FlatList
              data={menus}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                const isSelected = selectedMenuIds.includes(item.id);
                return (
                  <Pressable
                    style={[styles.dropdownItem, isSelected && styles.dropdownItemSelected]}
                    onPress={() => toggleMenuId(item.id)}
                  >
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
            <View style={styles.dropdownCreateRow}>
              <TextInput
                style={styles.dropdownCreateInput}
                placeholder="Nouveau menu..."
                placeholderTextColor={colors.textMuted}
                value={newMenuName}
                onChangeText={setNewMenuName}
                onSubmitEditing={() => {
                  if (newMenuName.trim()) {
                    const col = addCollection(newMenuName.trim(), 'menu');
                    setSelectedMenuIds((prev) => [...prev, col.id]);
                    setNewMenuName('');
                  }
                }}
                returnKeyType="done"
              />
              <Pressable
                style={[
                  styles.dropdownCreateButton,
                  !newMenuName.trim() && styles.dropdownCreateButtonDisabled,
                ]}
                onPress={() => {
                  if (newMenuName.trim()) {
                    const col = addCollection(newMenuName.trim(), 'menu');
                    setSelectedMenuIds((prev) => [...prev, col.id]);
                    setNewMenuName('');
                  }
                }}
                disabled={!newMenuName.trim()}
              >
                <Ionicons
                  name="add"
                  size={20}
                  color={newMenuName.trim() ? colors.accent : colors.textMuted}
                />
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Sticky Bottom Buttons */}
      <View style={styles.stickyBottom}>
        <Pressable style={styles.modifyButton} onPress={handleDiscard}>
          <Text style={styles.modifyButtonText}>Supprimer</Text>
        </Pressable>
        <Pressable
          style={[styles.saveButton, createRecipe.isPending && styles.saveButtonDisabled]}
          onPress={methods.handleSubmit(handleSave, handleValidationError)}
          disabled={createRecipe.isPending}
        >
          <Text style={styles.saveButtonText}>
            {createRecipe.isPending ? 'Enregistrement...' : 'Enregistrer'}
          </Text>
        </Pressable>
      </View>
    </>
  );
}

function extractStructuredIngredients(recipe: ExtractedRecipe): ParsedIngredient[] {
  if (!recipe.ingredients) return [];
  return recipe.ingredients.map((i) => ({
    name: i.notes ? `${i.name} (${i.notes})` : i.name,
    quantity: i.quantity ? String(i.quantity) : '',
    unit: i.unit || '',
  }));
}

function mapRecipeToForm(recipe: ExtractedRecipe): ReviewRecipeFormData {
  const ingredientsText = extractStructuredIngredients(recipe)
    .map((i) => {
      const parts: string[] = [];
      if (i.quantity) parts.push(i.quantity);
      if (i.unit) parts.push(i.unit);
      parts.push(i.name);
      return parts.join(' ');
    })
    .join('\n');

  return {
    title: recipe.title || '',
    description: recipe.description || '',
    ingredientsText,
    stepsText: recipe.instructions?.map((s) => s.text || '').join('\n') || '',
    prepTime: recipe.prepTime || null,
    cookTime: recipe.cookTime || null,
    servings: recipe.servings || null,
    photoUri: recipe.thumbnailUrl ?? null,
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
  },
  headerButtonContainer: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: fonts.script,
    fontSize: 22,
    color: colors.text,
    maxWidth: 250,
  },
  bottomPadding: {
    height: 180,
  },
  stickyBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
    backgroundColor: colors.background,
  },
  modifyButton: {
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
  },
  modifyButtonText: {
    fontFamily: fonts.script,
    fontSize: 16,
    color: colors.text,
  },
  saveButton: {
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.accent,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontFamily: fonts.script,
    fontSize: 16,
    color: '#FFFFFF',
  },
  collectionSection: {
    marginBottom: spacing.md,
  },
  collectionSectionTitle: {
    fontFamily: fonts.script,
    fontSize: 16,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  collectionSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  collectionSelectorText: {
    ...typography.body,
    color: colors.text,
    flex: 1,
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
  },
  dropdownItemSelected: {
    backgroundColor: colors.surface,
  },
  dropdownItemText: {
    ...typography.body,
    color: colors.text,
    flex: 1,
    marginRight: spacing.sm,
  },
  dropdownItemTextSelected: {
    fontWeight: '600',
  },
  dropdownCreateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  dropdownCreateInput: {
    flex: 1,
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
  dropdownCreateButton: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownCreateButtonDisabled: {
    borderColor: colors.border,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  errorText: {
    fontFamily: fonts.script,
    fontSize: 18,
    color: colors.text,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
});

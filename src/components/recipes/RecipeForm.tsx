import { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  Image,
  Pressable,
  TextInput as RNTextInput,
} from 'react-native';
import { Controller, Control, FieldErrors, useWatch } from 'react-hook-form';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

import { TextInput, Button, Text, Icon } from '../ui';
import { SwipeToDelete } from '../ui/SwipeToDelete';
import { IngredientEditor, parseIngredientsText, ingredientsToText } from './IngredientEditor';
import type { ParsedIngredient } from './IngredientEditor';
import type { CreateRecipeFormData } from '../../schemas/recipe.schema';
import { colors, spacing, radius, fonts, typography } from '../../theme';
import { persistImage } from '../../utils/imageCompression';
import { useCollectionStore } from '../../stores/collectionStore';

interface RecipeFormProps {
  control: Control<CreateRecipeFormData>;
  errors: FieldErrors<CreateRecipeFormData>;
  photoUri: string | null;
  onPhotoChange: (uri: string | null) => void;
  autoFocusTitle?: boolean;
  onDelete?: () => void;
  onIngredientsChange?: (ingredients: ParsedIngredient[]) => void;
}

export function RecipeForm({
  control,
  errors,
  photoUri,
  onPhotoChange,
  autoFocusTitle = false,
  onDelete,
  onIngredientsChange,
}: RecipeFormProps) {
  // Ingredient form state
  const [ingredients, setIngredients] = useState<ParsedIngredient[]>([]);
  const [ingredientsInitialized, setIngredientsInitialized] = useState(false);

  // Steps form state
  const [steps, setSteps] = useState<string[]>([]);
  const [stepText, setStepText] = useState('');
  const [stepsInitialized, setStepsInitialized] = useState(false);

  // Notes form state
  const [notes, setNotes] = useState<string[]>([]);
  const [noteText, setNoteText] = useState('');
  const [notesInitialized, setNotesInitialized] = useState(false);

  // Collection store
  const collections = useCollectionStore((s) => s.collections);
  const recipeBooks = collections.filter((c) => c.type === 'recipeBook');
  const menus = collections.filter((c) => c.type === 'menu');
  const [bookDropdownOpen, setBookDropdownOpen] = useState(false);
  const [menuDropdownOpen, setMenuDropdownOpen] = useState(false);
  const [selectedBookIds, setSelectedBookIds] = useState<string[]>([]);
  const [selectedMenuIds, setSelectedMenuIds] = useState<string[]>([]);
  const [collectionsInitialized, setCollectionsInitialized] = useState(false);

  // Watch form fields to initialize from existing data (edit mode)
  const ingredientsText = useWatch({ control, name: 'ingredientsText' });
  const stepsText = useWatch({ control, name: 'stepsText' });
  const notesValue = useWatch({ control, name: 'notes' });
  const catalogueValue = useWatch({ control, name: 'catalogue' });
  const regimeValue = useWatch({ control, name: 'regime' });

  // Initialize collection selections from existing data (edit mode)
  useEffect(() => {
    if (!collectionsInitialized) {
      if (catalogueValue) setSelectedBookIds(catalogueValue.split(',').filter(Boolean));
      if (regimeValue) setSelectedMenuIds(regimeValue.split(',').filter(Boolean));
      setCollectionsInitialized(true);
    }
  }, [catalogueValue, regimeValue, collectionsInitialized]);

  // Initialize ingredients from existing text (edit mode)
  useEffect(() => {
    if (!ingredientsInitialized && ingredientsText) {
      const parsed = parseIngredientsText(ingredientsText);
      setIngredients(parsed);
      setIngredientsInitialized(true);
      onIngredientsChange?.(parsed);
    }
  }, [ingredientsText, ingredientsInitialized]);

  // Initialize steps from existing text (edit mode)
  useEffect(() => {
    if (!stepsInitialized && stepsText) {
      setSteps(
        stepsText
          .split('\n')
          .filter((line) => line.trim())
          .map((line) => line.trim())
      );
      setStepsInitialized(true);
    }
  }, [stepsText, stepsInitialized]);

  const handleAddStep = useCallback(
    (onChange: (value: string) => void) => {
      const trimmed = stepText.trim();
      if (!trimmed) return;

      const updated = [...steps, trimmed];
      setSteps(updated);
      onChange(updated.join('\n'));
      setStepText('');
    },
    [stepText, steps]
  );

  const handleRemoveStep = useCallback(
    (index: number, onChange: (value: string) => void) => {
      const updated = steps.filter((_, i) => i !== index);
      setSteps(updated);
      onChange(updated.join('\n'));
    },
    [steps]
  );

  const handleEditStep = useCallback(
    (index: number, value: string, onChange: (value: string) => void) => {
      const updated = steps.map((s, i) => (i === index ? value : s));
      setSteps(updated);
      onChange(updated.join('\n'));
    },
    [steps]
  );

  // Initialize notes from existing text (edit mode)
  useEffect(() => {
    if (!notesInitialized && notesValue) {
      setNotes(
        notesValue
          .split('\n')
          .filter((line) => line.trim())
          .map((line) => line.trim())
      );
      setNotesInitialized(true);
    }
  }, [notesValue, notesInitialized]);

  const handleAddNote = useCallback(
    (onChange: (value: string) => void) => {
      const trimmed = noteText.trim();
      if (!trimmed) return;

      const updated = [...notes, trimmed];
      setNotes(updated);
      onChange(updated.join('\n'));
      setNoteText('');
    },
    [noteText, notes]
  );

  const handleRemoveNote = useCallback(
    (index: number, onChange: (value: string) => void) => {
      const updated = notes.filter((_, i) => i !== index);
      setNotes(updated);
      onChange(updated.join('\n'));
    },
    [notes]
  );

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      const persistedUri = await persistImage(result.assets[0].uri);
      onPhotoChange(persistedUri);
    }
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        'Permission requise',
        "L'accès à la caméra est nécessaire pour prendre des photos"
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      const persistedUri = await persistImage(result.assets[0].uri);
      onPhotoChange(persistedUri);
    }
  };

  const showPhotoOptions = () => {
    Alert.alert('Ajouter une photo', 'Choisir une option', [
      { text: 'Prendre une photo', onPress: takePhoto },
      { text: 'Choisir dans la galerie', onPress: pickImage },
      { text: 'Annuler', style: 'cancel' },
    ]);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      automaticallyAdjustKeyboardInsets
    >
      {/* Top Card Section */}
      <View style={styles.card}>
        {/* Title */}
        <Controller
          control={control}
          name="title"
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={styles.cardRow}>
              <TextInput
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="Titre"
                error={errors.title?.message}
                autoFocus={autoFocusTitle}
                style={styles.cardInput}
              />
            </View>
          )}
        />

        {/* Image Row */}
        <View style={styles.cardRowBordered}>
          <Text style={styles.cardLabel}>Image</Text>
          <Pressable onPress={showPhotoOptions} style={styles.cameraButton}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.photoThumbnail} />
            ) : (
              <View style={styles.cameraIconBox}>
                <Icon name="camera" size="md" color={colors.textMuted} />
              </View>
            )}
          </Pressable>
        </View>

        {/* Livre de recette Row */}
        <Controller
          control={control}
          name="catalogue"
          render={({ field: { onChange } }) => {
            const selectedNames = recipeBooks
              .filter((b) => selectedBookIds.includes(b.id))
              .map((b) => b.name);
            const toggleBook = (id: string) => {
              const updated = selectedBookIds.includes(id)
                ? selectedBookIds.filter((x) => x !== id)
                : [...selectedBookIds, id];
              setSelectedBookIds(updated);
              onChange(updated.join(',') || null);
            };
            return (
              <View>
                <Pressable
                  style={styles.cardRowBordered}
                  onPress={() => {
                    setBookDropdownOpen(!bookDropdownOpen);
                    setMenuDropdownOpen(false);
                  }}
                >
                  <Text style={styles.cardLabel}>Livre de recette</Text>
                  <View style={styles.cardChevronRow}>
                    <Text style={styles.cardChevron}>
                      {selectedNames.length > 0 ? selectedNames.join(', ') : 'sélectionner'}
                    </Text>
                    <Ionicons
                      name={bookDropdownOpen ? 'chevron-down' : 'chevron-forward'}
                      size={16}
                      color={colors.textMuted}
                    />
                  </View>
                </Pressable>
                {bookDropdownOpen && (
                  <View style={styles.dropdownList}>
                    {recipeBooks.map((book) => (
                      <Pressable
                        key={book.id}
                        style={styles.dropdownItem}
                        onPress={() => toggleBook(book.id)}
                      >
                        <Text
                          style={[
                            styles.dropdownItemText,
                            selectedBookIds.includes(book.id) && styles.dropdownItemSelected,
                          ]}
                        >
                          {book.name}
                        </Text>
                        {selectedBookIds.includes(book.id) && (
                          <Ionicons name="checkmark" size={18} color={colors.accent} />
                        )}
                      </Pressable>
                    ))}
                    {recipeBooks.length === 0 && (
                      <Text style={styles.dropdownEmpty}>Aucun livre créé</Text>
                    )}
                  </View>
                )}
              </View>
            );
          }}
        />

        {/* Regime & Menu Row */}
        <Controller
          control={control}
          name="regime"
          render={({ field: { onChange } }) => {
            const selectedNames = menus
              .filter((m) => selectedMenuIds.includes(m.id))
              .map((m) => m.name);
            const toggleMenu = (id: string) => {
              const updated = selectedMenuIds.includes(id)
                ? selectedMenuIds.filter((x) => x !== id)
                : [...selectedMenuIds, id];
              setSelectedMenuIds(updated);
              onChange(updated.join(',') || null);
            };
            return (
              <View>
                <Pressable
                  style={styles.cardRowBordered}
                  onPress={() => {
                    setMenuDropdownOpen(!menuDropdownOpen);
                    setBookDropdownOpen(false);
                  }}
                >
                  <Text style={styles.cardLabel}>Regime & Menu</Text>
                  <View style={styles.cardChevronRow}>
                    <Text style={styles.cardChevron}>
                      {selectedNames.length > 0 ? selectedNames.join(', ') : 'sélectionner'}
                    </Text>
                    <Ionicons
                      name={menuDropdownOpen ? 'chevron-down' : 'chevron-forward'}
                      size={16}
                      color={colors.textMuted}
                    />
                  </View>
                </Pressable>
                {menuDropdownOpen && (
                  <View style={styles.dropdownList}>
                    {menus.map((menu) => (
                      <Pressable
                        key={menu.id}
                        style={styles.dropdownItem}
                        onPress={() => toggleMenu(menu.id)}
                      >
                        <Text
                          style={[
                            styles.dropdownItemText,
                            selectedMenuIds.includes(menu.id) && styles.dropdownItemSelected,
                          ]}
                        >
                          {menu.name}
                        </Text>
                        {selectedMenuIds.includes(menu.id) && (
                          <Ionicons name="checkmark" size={18} color={colors.accent} />
                        )}
                      </Pressable>
                    ))}
                    {menus.length === 0 && (
                      <Text style={styles.dropdownEmpty}>Aucun menu créé</Text>
                    )}
                  </View>
                )}
              </View>
            );
          }}
        />

        {/* Nombre de portions */}
        <Controller
          control={control}
          name="servings"
          render={({ field: { onChange, value } }) => {
            const count = value ?? 4;
            return (
              <View style={styles.cardRowBordered}>
                <Text style={styles.cardLabel}>Nombre de portions</Text>
                <View style={styles.stepper}>
                  <Pressable
                    onPress={() => onChange(Math.max(1, count - 1))}
                    style={styles.stepperBtn}
                  >
                    <Text style={styles.stepperBtnText}>-</Text>
                  </Pressable>
                  <Text style={styles.stepperValue}>{count}</Text>
                  <Pressable onPress={() => onChange(count + 1)} style={styles.stepperBtn}>
                    <Text style={styles.stepperBtnText}>+</Text>
                  </Pressable>
                </View>
              </View>
            );
          }}
        />
      </View>

      {/* Time / Price / Kcal */}
      <View style={styles.nutritionRow}>
        <Controller
          control={control}
          name="cookingTime"
          render={({ field: { onChange, value } }) => (
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionLabel}>Temps</Text>
              <TextInput
                value={value?.toString() || ''}
                onChangeText={(v) => onChange(v ? parseInt(v, 10) : null)}
                placeholder="..."
                keyboardType="numeric"
                style={styles.nutritionInput}
              />
              <Text style={styles.nutritionUnit}>mn</Text>
            </View>
          )}
        />
        <Controller
          control={control}
          name="priceMin"
          render={({ field: { onChange, value } }) => (
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionLabel}>Prix</Text>
              <TextInput
                value={value?.toString() || ''}
                onChangeText={(v) => onChange(v ? parseFloat(v) : null)}
                placeholder="..."
                keyboardType="numeric"
                style={styles.nutritionInput}
              />
              <Text style={styles.nutritionUnit}>€</Text>
            </View>
          )}
        />
        <Controller
          control={control}
          name="kcal"
          render={({ field: { onChange, value } }) => (
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionLabel}>Calories</Text>
              <TextInput
                value={value?.toString() || ''}
                onChangeText={(v) => onChange(v ? parseInt(v, 10) : null)}
                placeholder="..."
                keyboardType="numeric"
                style={styles.nutritionInput}
              />
              <Text style={styles.nutritionUnit}>kcal</Text>
            </View>
          )}
        />
      </View>

      {/* Nutritions Section */}
      <View style={styles.nutritionRow}>
        <Controller
          control={control}
          name="nutritionProteins"
          render={({ field: { onChange, value } }) => (
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionLabel}>Protéines</Text>
              <TextInput
                value={value?.toString() || ''}
                onChangeText={(v) => onChange(v ? parseFloat(v) : null)}
                placeholder="..."
                keyboardType="numeric"
                style={styles.nutritionInput}
              />
              <Text style={styles.nutritionUnit}>g</Text>
            </View>
          )}
        />
        <Controller
          control={control}
          name="nutritionCarbs"
          render={({ field: { onChange, value } }) => (
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionLabel}>Glucides</Text>
              <TextInput
                value={value?.toString() || ''}
                onChangeText={(v) => onChange(v ? parseFloat(v) : null)}
                placeholder="..."
                keyboardType="numeric"
                style={styles.nutritionInput}
              />
              <Text style={styles.nutritionUnit}>g</Text>
            </View>
          )}
        />
        <Controller
          control={control}
          name="nutritionFats"
          render={({ field: { onChange, value } }) => (
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionLabel}>Lipides</Text>
              <TextInput
                value={value?.toString() || ''}
                onChangeText={(v) => onChange(v ? parseFloat(v) : null)}
                placeholder="..."
                keyboardType="numeric"
                style={styles.nutritionInput}
              />
              <Text style={styles.nutritionUnit}>g</Text>
            </View>
          )}
        />
      </View>

      {/* Ingrédients */}
      <Text style={styles.sectionTitle}>Ingrédients</Text>
      <Controller
        control={control}
        name="ingredientsText"
        render={({ field: { onChange } }) => (
          <IngredientEditor
            ingredients={ingredients}
            onIngredientsChange={(updated) => {
              setIngredients(updated);
              onChange(ingredientsToText(updated));
              onIngredientsChange?.(updated);
            }}
          />
        )}
      />

      {/* Instructions */}
      <Text style={styles.sectionTitle}>Instructions</Text>
      <Controller
        control={control}
        name="stepsText"
        render={({ field: { onChange } }) => {
          return (
            <View style={styles.stepsSection}>
              {steps.map((step, index) => (
                <SwipeToDelete
                  key={`step-${index}`}
                  onDelete={() => handleRemoveStep(index, onChange)}
                  confirmMessage={`Supprimer l'étape ${index + 1} ?`}
                >
                  <View style={styles.stepRow}>
                    <Text style={styles.stepNumber}>{index + 1}.</Text>
                    <RNTextInput
                      style={styles.stepInput}
                      value={step}
                      onChangeText={(v) => handleEditStep(index, v, onChange)}
                      placeholder="Instruction"
                      placeholderTextColor={colors.textLight}
                      multiline
                      scrollEnabled={false}
                    />
                  </View>
                </SwipeToDelete>
              ))}

              {/* Add step form */}
              <RNTextInput
                style={styles.ingredientInput}
                placeholder="Ajouter une étape"
                placeholderTextColor={colors.textLight}
                value={stepText}
                onChangeText={setStepText}
                multiline
              />
              <Pressable
                style={[
                  styles.ingredientAddButton,
                  !stepText.trim() && styles.ingredientAddDisabled,
                ]}
                onPress={() => handleAddStep(onChange)}
                disabled={!stepText.trim()}
              >
                <Text style={styles.ingredientAddText}>Ajouter</Text>
              </Pressable>
            </View>
          );
        }}
      />

      {/* Notes */}
      <Text style={styles.sectionTitle}>Notes</Text>
      <Controller
        control={control}
        name="notes"
        render={({ field: { onChange } }) => (
          <View style={styles.stepsSection}>
            {/* Notes list */}
            {notes.map((note, index) => (
              <SwipeToDelete
                key={`note-${index}`}
                onDelete={() => handleRemoveNote(index, onChange)}
                confirmMessage="Supprimer cette note ?"
              >
                <View style={styles.noteRow}>
                  <Text style={styles.stepText}>{note}</Text>
                </View>
              </SwipeToDelete>
            ))}

            {/* Add note form */}
            <RNTextInput
              style={styles.ingredientInput}
              placeholder="Ajouter une astuce"
              placeholderTextColor={colors.textLight}
              value={noteText}
              onChangeText={setNoteText}
              multiline
            />
            <Pressable
              style={[styles.ingredientAddButton, !noteText.trim() && styles.ingredientAddDisabled]}
              onPress={() => handleAddNote(onChange)}
              disabled={!noteText.trim()}
            >
              <Text style={styles.ingredientAddText}>Ajouter</Text>
            </Pressable>
          </View>
        )}
      />

      {/* Delete Button (only in edit mode) */}
      {onDelete && (
        <View style={styles.deleteSection}>
          <Button title="Supprimer la recette" onPress={onDelete} variant="destructive" />
        </View>
      )}

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    gap: spacing.md,
  },

  // Card section
  card: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  cardRow: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  cardRowBordered: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border + '30',
  },
  cardLabel: {
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.text,
  },
  cardInput: {
    borderWidth: 0,
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    fontSize: 16,
  },
  cardChevronRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexShrink: 1,
  },
  cardChevron: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.textMuted,
    flexShrink: 1,
  },
  dropdownList: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingVertical: spacing.xs,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  dropdownItemText: {
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.text,
  },
  dropdownItemSelected: {
    color: colors.accent,
    fontWeight: '600',
  },
  dropdownEmpty: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.textMuted,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  cameraButton: {
    padding: 4,
  },
  cameraIconBox: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoThumbnail: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
  },

  // Stepper
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  stepperBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnText: {
    fontFamily: fonts.sans,
    fontSize: 18,
    color: colors.text,
    lineHeight: 20,
  },
  stepperValue: {
    fontFamily: fonts.sans,
    fontSize: 16,
    color: colors.text,
    minWidth: 20,
    textAlign: 'center',
  },

  // Section titles
  sectionTitle: {
    fontFamily: fonts.script,
    fontSize: 20,
    color: colors.text,
    marginTop: spacing.sm,
  },

  // Nutrition
  nutritionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  nutritionItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  nutritionLabel: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.textMuted,
  },
  nutritionInput: {
    textAlign: 'center',
    borderWidth: 0,
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    fontSize: 15,
    minHeight: 30,
  },
  nutritionUnit: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.textMuted,
  },

  // Ingredients & shared add-form styles
  ingredientInput: {
    ...typography.body,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    backgroundColor: '#FFFFFF',
    color: colors.text,
  },
  ingredientAddButton: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  ingredientAddDisabled: {
    opacity: 0.5,
  },
  ingredientAddText: {
    ...typography.body,
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // Steps
  stepsSection: {
    gap: spacing.sm,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  stepNumber: {
    fontFamily: fonts.sans,
    fontSize: 15,
    fontWeight: '600',
    color: colors.accent,
    marginTop: 2,
  },
  stepInput: {
    ...typography.body,
    color: colors.text,
    flex: 1,
    paddingVertical: 0,
    textAlignVertical: 'top',
    minHeight: 20,
  },
  stepText: {
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.text,
    flex: 1,
  },

  noteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },

  // Navigation sections
  navSection: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  multiline: {
    minHeight: 100,
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  notesInput: {
    minHeight: 60,
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  deleteSection: {
    marginTop: spacing.xl,
  },
  bottomPadding: {
    height: spacing.xl,
  },
});

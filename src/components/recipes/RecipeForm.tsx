import { View, ScrollView, StyleSheet, Alert, Image, Pressable } from 'react-native';
import { Controller, Control, FieldErrors } from 'react-hook-form';
import * as ImagePicker from 'expo-image-picker';

import { TextInput, Button, Text, Icon } from '../ui';
import type { CreateRecipeFormData } from '../../schemas/recipe.schema';
import { colors, spacing, radius, fonts } from '../../theme';
import { persistImage } from '../../utils/imageCompression';

interface RecipeFormProps {
  control: Control<CreateRecipeFormData>;
  errors: FieldErrors<CreateRecipeFormData>;
  photoUri: string | null;
  onPhotoChange: (uri: string | null) => void;
  autoFocusTitle?: boolean;
  onDelete?: () => void;
}

export function RecipeForm({
  control,
  errors,
  photoUri,
  onPhotoChange,
  autoFocusTitle = false,
  onDelete,
}: RecipeFormProps) {
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

        {/* Catalogue Row */}
        <Controller
          control={control}
          name="catalogue"
          render={({ field: { onChange, value } }) => (
            <Pressable
              style={styles.cardRowBordered}
              onPress={() => {
                if (Alert.prompt) {
                  Alert.prompt('Catalogue', 'Entrez le catalogue', (text) => onChange(text));
                } else {
                  onChange(value ? null : 'Général');
                }
              }}
            >
              <Text style={styles.cardLabel}>Catalogue</Text>
              <Text style={styles.cardChevron}>{value || 'selectionner >'}</Text>
            </Pressable>
          )}
        />

        {/* Régime Row */}
        <Controller
          control={control}
          name="regime"
          render={({ field: { onChange, value } }) => (
            <Pressable
              style={styles.cardRowBordered}
              onPress={() => {
                if (Alert.prompt) {
                  Alert.prompt('Régime', 'Entrez le régime', (text) => onChange(text));
                } else {
                  onChange(value ? null : 'Standard');
                }
              }}
            >
              <Text style={styles.cardLabel}>Régime</Text>
              <Text style={styles.cardChevron}>{value || 'selectionner >'}</Text>
            </Pressable>
          )}
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

      {/* Ingrédients — navigable row */}
      <Text style={styles.sectionTitle}>Ingrédients</Text>
      <Controller
        control={control}
        name="ingredientsText"
        render={({ field: { onChange, onBlur, value } }) => (
          <View style={styles.navSection}>
            <TextInput
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="Ajouter les ingrédients"
              multiline
              style={styles.multiline}
            />
          </View>
        )}
      />

      {/* Instructions — navigable row */}
      <Text style={styles.sectionTitle}>Instructions</Text>
      <Controller
        control={control}
        name="stepsText"
        render={({ field: { onChange, onBlur, value } }) => (
          <View style={styles.navSection}>
            <TextInput
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="Ajouter les étapes"
              multiline
              style={styles.multiline}
            />
          </View>
        )}
      />

      {/* Notes */}
      <Text style={styles.sectionTitle}>Notes</Text>
      <Controller
        control={control}
        name="notes"
        render={({ field: { onChange, onBlur, value } }) => (
          <View style={styles.navSection}>
            <TextInput
              value={value || ''}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="Ajouter des astuces"
              multiline
              style={styles.notesInput}
            />
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
    borderColor: colors.border + '30',
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
  cardChevron: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.textMuted,
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
    borderColor: colors.border + '30',
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
    borderColor: colors.border + '30',
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

  // Navigation sections
  navSection: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border + '30',
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

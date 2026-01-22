import { View, ScrollView, StyleSheet, Alert, Image, Pressable } from 'react-native';
import { Controller, Control, FieldErrors } from 'react-hook-form';
import * as ImagePicker from 'expo-image-picker';

import { TextInput, Button, Text, Icon } from '../ui';
import type { CreateRecipeFormData } from '../../schemas/recipe.schema';
import { colors, spacing, radius, fonts } from '../../theme';

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
      onPhotoChange(result.assets[0].uri);
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
      onPhotoChange(result.assets[0].uri);
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
      <View style={styles.section}>
        {/* Title */}
        <Controller
          control={control}
          name="title"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              label="Titre"
              useScriptLabel
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="Nom de la recette"
              error={errors.title?.message}
              autoFocus={autoFocusTitle}
            />
          )}
        />

        {/* Photo */}
        <View style={styles.photoSection}>
          <Text style={styles.sectionLabel}>Image</Text>
          {photoUri ? (
            <View>
              <Image source={{ uri: photoUri }} style={styles.photoPreview} />
              <View style={styles.photoActions}>
                <Button
                  title="Remplacer"
                  onPress={showPhotoOptions}
                  variant="secondary"
                  size="sm"
                  style={styles.photoButton}
                />
                <Button
                  title="Supprimer"
                  onPress={() => onPhotoChange(null)}
                  variant="destructive"
                  size="sm"
                  style={styles.photoButton}
                />
              </View>
            </View>
          ) : (
            <Pressable style={styles.addPhotoButton} onPress={showPhotoOptions}>
              <Icon name="camera" size="lg" color={colors.textMuted} />
              <Text style={styles.addPhotoText}>Ajouter une photo</Text>
            </Pressable>
          )}
        </View>

        {/* Cooking Time & Servings */}
        <View style={styles.row}>
          <View style={styles.halfInput}>
            <Controller
              control={control}
              name="cookingTime"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  label="Temps (min)"
                  useScriptLabel
                  value={value?.toString() || ''}
                  onChangeText={(v) => onChange(v ? parseInt(v, 10) : null)}
                  placeholder="30"
                  keyboardType="numeric"
                />
              )}
            />
          </View>
          <View style={styles.halfInput}>
            <Controller
              control={control}
              name="servings"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  label="Portions"
                  useScriptLabel
                  value={value?.toString() || ''}
                  onChangeText={(v) => onChange(v ? parseInt(v, 10) : null)}
                  placeholder="4"
                  keyboardType="numeric"
                />
              )}
            />
          </View>
        </View>
      </View>

      {/* Ingredients */}
      <View style={styles.section}>
        <Controller
          control={control}
          name="ingredientsText"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              label="Ingrédients"
              useScriptLabel
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="Un ingrédient par ligne"
              multiline
              style={styles.multiline}
            />
          )}
        />
      </View>

      {/* Steps */}
      <View style={styles.section}>
        <Controller
          control={control}
          name="stepsText"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              label="Instructions"
              useScriptLabel
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="Une étape par ligne"
              multiline
              style={styles.multiline}
            />
          )}
        />
      </View>

      {/* Notes */}
      <View style={styles.section}>
        <Controller
          control={control}
          name="notes"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              label="Notes"
              useScriptLabel
              value={value || ''}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="Astuces et conseils..."
              multiline
              style={styles.notesInput}
            />
          )}
        />
      </View>

      {/* Delete Button (only in edit mode) */}
      {onDelete && (
        <View style={styles.deleteSection}>
          <Button
            title="Supprimer la recette"
            onPress={onDelete}
            variant="destructive"
          />
        </View>
      )}

      {/* Bottom padding for scroll */}
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
  section: {
    // No background or border - just spacing
  },
  sectionLabel: {
    fontFamily: fonts.script,
    fontSize: 16,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  photoSection: {
    marginTop: spacing.md,
  },
  photoPreview: {
    width: '100%',
    height: 180,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
  },
  photoActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  photoButton: {
    flex: 1,
  },
  addPhotoButton: {
    height: 120,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
    gap: spacing.sm,
  },
  addPhotoText: {
    fontFamily: fonts.script,
    fontSize: 16,
    color: colors.textMuted,
  },
  multiline: {
    minHeight: 120,
  },
  notesInput: {
    minHeight: 80,
  },
  deleteSection: {
    marginTop: spacing.xl,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  halfInput: {
    flex: 1,
  },
  bottomPadding: {
    height: spacing.xl,
  },
});

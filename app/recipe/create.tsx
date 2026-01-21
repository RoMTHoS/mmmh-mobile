import { useState } from 'react';
import { View, ScrollView, StyleSheet, Alert, Image, Pressable } from 'react-native';
import { Stack, router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';

import { useCreateRecipe } from '../../src/hooks';
import { TextInput, Button, Text, Icon, Card } from '../../src/components/ui';
import { createRecipeSchema, type CreateRecipeFormData } from '../../src/schemas/recipe.schema';
import type { Ingredient, Step } from '../../src/types';
import { colors, spacing, radius, fonts } from '../../src/theme';

export default function CreateRecipeScreen() {
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const createRecipe = useCreateRecipe();

  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<CreateRecipeFormData>({
    resolver: zodResolver(createRecipeSchema),
    defaultValues: {
      title: '',
      ingredientsText: '',
      stepsText: '',
      cookingTime: null,
      servings: null,
      notes: '',
    },
  });

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
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
      setPhotoUri(result.assets[0].uri);
    }
  };

  const showPhotoOptions = () => {
    Alert.alert('Ajouter une photo', 'Choisir une option', [
      { text: 'Prendre une photo', onPress: takePhoto },
      { text: 'Choisir dans la galerie', onPress: pickImage },
      { text: 'Annuler', style: 'cancel' },
    ]);
  };

  const parseIngredients = (text: string): Ingredient[] => {
    return text
      .split('\n')
      .filter((line) => line.trim())
      .map((line) => ({
        name: line.trim(),
        quantity: null,
        unit: null,
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

  const onSubmit = async (data: CreateRecipeFormData) => {
    try {
      const recipe = await createRecipe.mutateAsync({
        title: data.title,
        ingredients: parseIngredients(data.ingredientsText || ''),
        steps: parseSteps(data.stepsText || ''),
        cookingTime: data.cookingTime ?? null,
        servings: data.servings ?? null,
        notes: data.notes || null,
        photoUri,
      });

      Toast.show({
        type: 'success',
        text1: 'Recette enregistrée',
        text2: 'Votre recette a été créée avec succès',
        visibilityTime: 2000,
      });

      router.replace(`/recipe/${recipe.id}`);
    } catch {
      Toast.show({
        type: 'error',
        text1: 'Erreur de sauvegarde',
        text2: 'Veuillez réessayer',
      });
    }
  };

  const handleCancel = () => {
    if (isDirty || photoUri) {
      Alert.alert(
        'Abandonner les modifications ?',
        'Vous avez des modifications non enregistrées. Voulez-vous vraiment les abandonner ?',
        [
          { text: 'Continuer', style: 'cancel' },
          { text: 'Abandonner', style: 'destructive', onPress: () => router.back() },
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
            <Pressable onPress={handleCancel} hitSlop={8}>
              <Text style={styles.headerButton}>Annuler</Text>
            </Pressable>
          ),
          headerRight: () => (
            <Pressable
              onPress={handleSubmit(onSubmit)}
              disabled={createRecipe.isPending}
              hitSlop={8}
            >
              <Text
                style={[styles.headerButton, createRecipe.isPending && styles.headerButtonDisabled]}
              >
                Valider
              </Text>
            </Pressable>
          ),
        }}
      />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.formCard}>
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
                autoFocus
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
                    onPress={() => setPhotoUri(null)}
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
        </Card>

        {/* Ingredients */}
        <Card style={styles.formCard}>
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
        </Card>

        {/* Steps */}
        <Card style={styles.formCard}>
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
        </Card>

        {/* Notes */}
        <Card style={styles.formCard}>
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
        </Card>

        {/* Bottom padding for scroll */}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </>
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
  headerButton: {
    fontFamily: fonts.script,
    fontSize: 18,
    color: colors.text,
  },
  headerButtonDisabled: {
    opacity: 0.5,
  },
  formCard: {
    padding: spacing.md,
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

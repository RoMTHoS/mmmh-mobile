import { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert, Image, Pressable } from 'react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';

import { useRecipe, useUpdateRecipe } from '../../../src/hooks';
import { LoadingScreen, TextInput, Button, Text } from '../../../src/components/ui';
import { createRecipeSchema, type CreateRecipeFormData } from '../../../src/schemas/recipe.schema';
import type { Ingredient, Step } from '../../../src/types';

export default function EditRecipeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: recipe, isLoading } = useRecipe(id);
  const updateRecipe = useUpdateRecipe();

  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoRemoved, setPhotoRemoved] = useState(false);
  const [originalPhotoUri, setOriginalPhotoUri] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    reset,
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

  // Pre-populate form when recipe loads
  useEffect(() => {
    if (recipe) {
      reset({
        title: recipe.title,
        ingredientsText: ingredientsToText(recipe.ingredients),
        stepsText: stepsToText(recipe.steps),
        cookingTime: recipe.cookingTime,
        servings: recipe.servings,
        notes: recipe.notes || '',
      });
      setPhotoUri(recipe.photoUri);
      setOriginalPhotoUri(recipe.photoUri);
    }
  }, [recipe, reset]);

  const hasPhotoChanges = photoRemoved || photoUri !== originalPhotoUri;
  const hasChanges = isDirty || hasPhotoChanges;

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
      setPhotoRemoved(false);
    }
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Camera permission is required to take photos');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
      setPhotoRemoved(false);
    }
  };

  const showPhotoOptions = () => {
    Alert.alert('Add Photo', 'Choose an option', [
      { text: 'Take Photo', onPress: takePhoto },
      { text: 'Choose from Gallery', onPress: pickImage },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const removePhoto = () => {
    setPhotoUri(null);
    setPhotoRemoved(true);
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
      await updateRecipe.mutateAsync({
        id,
        input: {
          title: data.title,
          ingredients: parseIngredients(data.ingredientsText || ''),
          steps: parseSteps(data.stepsText || ''),
          cookingTime: data.cookingTime ?? null,
          servings: data.servings ?? null,
          notes: data.notes || null,
          photoUri: photoRemoved ? null : photoUri,
        },
      });

      Toast.show({
        type: 'success',
        text1: 'Recipe updated!',
        text2: 'Your changes have been saved',
        visibilityTime: 2000,
      });

      router.back();
    } catch {
      Toast.show({
        type: 'error',
        text1: 'Failed to update recipe',
        text2: 'Please try again',
      });
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      Alert.alert(
        'Discard changes?',
        'You have unsaved changes. Are you sure you want to discard them?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => router.back() },
        ]
      );
    } else {
      router.back();
    }
  };

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ title: 'Loading...' }} />
        <LoadingScreen />
      </>
    );
  }

  if (!recipe) {
    return null;
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Edit Recipe',
          headerLeft: () => (
            <Pressable onPress={handleCancel} hitSlop={8}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          ),
          headerRight: () => (
            <Button
              title="Save"
              onPress={handleSubmit(onSubmit)}
              loading={updateRecipe.isPending}
              style={styles.saveButton}
            />
          ),
        }}
      />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Title */}
        <Controller
          control={control}
          name="title"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              label="Title"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="Recipe name"
              error={errors.title?.message}
            />
          )}
        />

        {/* Photo */}
        <View style={styles.photoSection}>
          <Text style={styles.label}>Photo</Text>
          {photoUri ? (
            <View>
              <Image source={{ uri: photoUri }} style={styles.photoPreview} />
              <View style={styles.photoActions}>
                <Button
                  title="Replace"
                  onPress={showPhotoOptions}
                  variant="secondary"
                  style={styles.photoButton}
                />
                <Button
                  title="Remove"
                  onPress={removePhoto}
                  variant="destructive"
                  style={styles.photoButton}
                />
              </View>
            </View>
          ) : (
            <Pressable style={styles.addPhotoButton} onPress={showPhotoOptions}>
              <Text style={styles.addPhotoText}>+ Add Photo</Text>
            </Pressable>
          )}
        </View>

        {/* Ingredients */}
        <Controller
          control={control}
          name="ingredientsText"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              label="Ingredients"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="Enter each ingredient on a new line"
              multiline
              style={styles.multiline}
            />
          )}
        />

        {/* Steps */}
        <Controller
          control={control}
          name="stepsText"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              label="Steps"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="Enter each step on a new line"
              multiline
              style={styles.multiline}
            />
          )}
        />

        {/* Cooking Time & Servings */}
        <View style={styles.row}>
          <View style={styles.halfInput}>
            <Controller
              control={control}
              name="cookingTime"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  label="Time (min)"
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
                  label="Servings"
                  value={value?.toString() || ''}
                  onChangeText={(v) => onChange(v ? parseInt(v, 10) : null)}
                  placeholder="4"
                  keyboardType="numeric"
                />
              )}
            />
          </View>
        </View>

        {/* Notes */}
        <Controller
          control={control}
          name="notes"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              label="Notes"
              value={value || ''}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="Any additional notes..."
              multiline
              style={styles.notesInput}
            />
          )}
        />

        {/* Bottom padding for scroll */}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </>
  );
}

// Helper functions to convert arrays to text for form
function ingredientsToText(ingredients: Ingredient[]): string {
  return ingredients
    .map((i) => {
      const parts = [];
      if (i.quantity) parts.push(i.quantity);
      if (i.unit) parts.push(i.unit);
      parts.push(i.name);
      return parts.join(' ');
    })
    .join('\n');
}

function stepsToText(steps: Step[]): string {
  return steps.map((s) => s.instruction).join('\n');
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    padding: 16,
    gap: 16,
  },
  cancelText: {
    color: '#D97706',
    fontSize: 16,
  },
  saveButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    minHeight: 36,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  photoSection: {
    marginBottom: 0,
  },
  photoPreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
  },
  photoActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  photoButton: {
    flex: 1,
  },
  addPhotoButton: {
    height: 120,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  addPhotoText: {
    color: '#6B7280',
    fontSize: 16,
  },
  multiline: {
    minHeight: 120,
  },
  notesInput: {
    minHeight: 80,
  },
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  halfInput: {
    flex: 1,
  },
  bottomPadding: {
    height: 40,
  },
});

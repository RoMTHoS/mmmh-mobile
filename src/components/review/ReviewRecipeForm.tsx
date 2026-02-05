import { View, Image, StyleSheet, Alert, Pressable } from 'react-native';
import { Controller, useFormContext } from 'react-hook-form';
import * as ImagePicker from 'expo-image-picker';

import { TextInput, Button, Text, Icon } from '../ui';
import { AIBadge } from './AIBadge';
import type { ReviewRecipeFormData } from '../../schemas/review.schema';
import { colors, spacing, radius, fonts } from '../../theme';

interface Props {
  photoUri: string | null;
  onPhotoChange: (uri: string | null) => void;
  hasAiPhoto: boolean;
}

export function ReviewRecipeForm({ photoUri, onPhotoChange, hasAiPhoto }: Props) {
  const {
    control,
    formState: { errors },
  } = useFormContext<ReviewRecipeFormData>();

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
        "L'acces a la camera est necessaire pour prendre des photos"
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
    <View>
      {/* Photo Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>Image</Text>
          {hasAiPhoto && <AIBadge />}
        </View>
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

      {/* Title */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>Titre *</Text>
          <AIBadge />
        </View>
        <Controller
          control={control}
          name="title"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="Nom de la recette"
              error={errors.title?.message}
            />
          )}
        />
      </View>

      {/* Description */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>Description</Text>
          <AIBadge />
        </View>
        <Controller
          control={control}
          name="description"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              value={value || ''}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="Breve description"
              multiline
              style={styles.descriptionInput}
            />
          )}
        />
      </View>

      {/* Time and Servings */}
      <View style={styles.row}>
        <View style={styles.thirdInput}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>Prep</Text>
            <AIBadge />
          </View>
          <Controller
            control={control}
            name="prepTime"
            render={({ field: { onChange, value } }) => (
              <TextInput
                value={value?.toString() || ''}
                onChangeText={(v) => onChange(v ? parseInt(v, 10) : null)}
                placeholder="min"
                keyboardType="numeric"
              />
            )}
          />
        </View>
        <View style={styles.thirdInput}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>Cuisson</Text>
            <AIBadge />
          </View>
          <Controller
            control={control}
            name="cookTime"
            render={({ field: { onChange, value } }) => (
              <TextInput
                value={value?.toString() || ''}
                onChangeText={(v) => onChange(v ? parseInt(v, 10) : null)}
                placeholder="min"
                keyboardType="numeric"
              />
            )}
          />
        </View>
        <View style={styles.thirdInput}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>Portions</Text>
            <AIBadge />
          </View>
          <Controller
            control={control}
            name="servings"
            render={({ field: { onChange, value } }) => (
              <TextInput
                value={value?.toString() || ''}
                onChangeText={(v) => onChange(v ? parseInt(v, 10) : null)}
                placeholder="4"
                keyboardType="numeric"
              />
            )}
          />
        </View>
      </View>

      {/* Ingredients */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>Ingredients *</Text>
          <AIBadge />
        </View>
        <Controller
          control={control}
          name="ingredientsText"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="Un ingredient par ligne"
              multiline
              style={styles.multiline}
              error={errors.ingredientsText?.message}
            />
          )}
        />
      </View>

      {/* Instructions */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>Instructions *</Text>
          <AIBadge />
        </View>
        <Controller
          control={control}
          name="stepsText"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="Une etape par ligne"
              multiline
              style={styles.multiline}
              error={errors.stepsText?.message}
            />
          )}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
    gap: spacing.sm,
  },
  sectionLabel: {
    fontFamily: fonts.script,
    fontSize: 16,
    color: colors.text,
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
  descriptionInput: {
    minHeight: 60,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  thirdInput: {
    flex: 1,
  },
  multiline: {
    minHeight: 120,
  },
});

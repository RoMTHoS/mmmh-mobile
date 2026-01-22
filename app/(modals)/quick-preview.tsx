import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../src/theme';

interface InfoItemProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  value: string;
}

function InfoItem({ icon, value }: InfoItemProps) {
  return (
    <View style={styles.infoItem}>
      <Ionicons name={icon} size={18} color={colors.textMuted} />
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

export default function QuickPreviewModal() {
  const { id, title, imageUri, prepTime, cookTime, estimatedCost, calories, difficulty } =
    useLocalSearchParams<{
      id: string;
      title: string;
      imageUri?: string;
      prepTime?: string;
      cookTime?: string;
      estimatedCost?: string;
      calories?: string;
      difficulty?: string;
    }>();

  const handleClose = () => {
    router.back();
  };

  const handleViewRecipe = () => {
    handleClose();
    if (id) {
      router.push(`/recipe/${id}`);
    }
  };

  const totalTime =
    prepTime || cookTime ? `${parseInt(prepTime || '0') + parseInt(cookTime || '0')} mn` : null;

  return (
    <View style={styles.overlay}>
      <Pressable style={styles.backdrop} onPress={handleClose} />
      <View style={styles.card}>
        <Text style={styles.title}>{title || 'Recipe'}</Text>

        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <Ionicons name="image-outline" size={48} color={colors.textMuted} />
          </View>
        )}

        <View style={styles.infoRow}>
          {totalTime && <InfoItem icon="time-outline" value={totalTime} />}
          {estimatedCost && <InfoItem icon="cash-outline" value={estimatedCost} />}
          {calories && <InfoItem icon="flame-outline" value={`${calories} kcal`} />}
          {difficulty && <InfoItem icon="star-outline" value={difficulty} />}
        </View>

        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          onPress={handleViewRecipe}
        >
          <Text style={styles.buttonText}>Voir la recette</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
  },
  card: {
    backgroundColor: colors.modalBackground,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
  },
  title: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  image: {
    width: '100%',
    height: 180,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
  },
  imagePlaceholder: {
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.lg,
    marginBottom: spacing.xl,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  infoValue: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  button: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing['2xl'],
    borderRadius: borderRadius.full,
    width: '100%',
    alignItems: 'center',
  },
  buttonPressed: {
    opacity: 0.9,
  },
  buttonText: {
    ...typography.button,
    color: colors.background,
  },
});

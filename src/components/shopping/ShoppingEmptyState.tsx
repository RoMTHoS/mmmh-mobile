import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, typography, spacing, radius } from '../../theme';

export function ShoppingEmptyState() {
  const router = useRouter();

  return (
    <View style={styles.container} testID="shopping-empty-state">
      <Ionicons name="cart-outline" size={64} color={colors.textMuted} />
      <Text style={styles.title}>Votre liste est vide</Text>
      <Text style={styles.subtitle}>Ajoutez des recettes depuis l'écran de détail</Text>
      <Pressable
        style={styles.button}
        onPress={() => router.push('/(tabs)')}
        testID="empty-state-cta"
      >
        <Text style={styles.buttonText}>Voir mes recettes</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  title: {
    ...typography.h3,
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.lg,
    maxWidth: 280,
  },
  button: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
  },
  buttonText: {
    ...typography.button,
    color: '#FFFFFF',
  },
});

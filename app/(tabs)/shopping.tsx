import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../../src/theme';

export default function ShoppingScreen() {
  return (
    <View style={styles.container}>
      <Ionicons name="cart-outline" size={64} color={colors.textMuted} />
      <Text style={styles.title}>Liste de courses</Text>
      <Text style={styles.subtitle}>Cette fonctionnalité arrive bientôt !</Text>
      <Text style={styles.description}>
        Vous pourrez créer des listes de courses à partir de vos recettes.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.base,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    ...typography.h2,
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  description: {
    ...typography.bodySmall,
    color: colors.textMuted,
    textAlign: 'center',
    maxWidth: 280,
  },
});

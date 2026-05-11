import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Button } from '../ui/Button';
import { colors, typography, spacing } from '../../theme';

export function ShoppingEmptyState() {
  const router = useRouter();

  return (
    <View style={styles.container} testID="shopping-empty-state">
      <Ionicons name="cart-outline" size={64} color={colors.textLight} />
      <Text style={styles.title}>Votre liste est vide</Text>
      <Text style={styles.description}>Ajoutez des recettes depuis l'écran de détail</Text>
      <Button
        title="Voir mes recettes"
        onPress={() => router.push('/(tabs)')}
        style={styles.button}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing['2xl'],
  },
  title: {
    ...typography.h2,
    color: colors.text,
    marginTop: spacing.base,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  description: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  button: {
    minWidth: 160,
  },
});

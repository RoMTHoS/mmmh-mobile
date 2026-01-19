import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../ui';
import { colors, typography, spacing } from '../../theme';

export function EmptyState() {
  const handleCreatePress = () => {
    router.push('/recipe/create');
  };

  return (
    <View style={styles.container} testID="empty-state">
      <Ionicons name="book-outline" size={64} color={colors.textLight} />
      <Text style={styles.title}>Aucune recette</Text>
      <Text style={styles.subtitle}>Appuyez sur + pour créer votre première recette</Text>
      <Button title="Créer une recette" onPress={handleCreatePress} style={styles.button} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing['2xl'],
    backgroundColor: colors.background,
  },
  title: {
    ...typography.h2,
    color: colors.text,
    marginTop: spacing.base,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  button: {
    minWidth: 160,
  },
});

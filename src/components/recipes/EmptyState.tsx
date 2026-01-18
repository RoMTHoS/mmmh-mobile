import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../ui';

export function EmptyState() {
  const handleCreatePress = () => {
    router.push('/recipe/create');
  };

  return (
    <View style={styles.container} testID="empty-state">
      <Ionicons name="book-outline" size={64} color="#D1D5DB" />
      <Text style={styles.title}>No recipes yet</Text>
      <Text style={styles.subtitle}>Tap + to create your first recipe</Text>
      <Button title="Create Recipe" onPress={handleCreatePress} style={styles.button} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    minWidth: 160,
  },
});

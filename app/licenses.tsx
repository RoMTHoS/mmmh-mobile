import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { colors, typography, spacing, borderRadius } from '../src/theme';

interface LicenseEntry {
  name: string;
  license: string;
}

const LICENSES: LicenseEntry[] = [
  { name: 'React Native', license: 'MIT' },
  { name: 'Expo', license: 'MIT' },
  { name: 'Expo Router', license: 'MIT' },
  { name: 'React Navigation', license: 'MIT' },
  { name: 'TanStack React Query', license: 'MIT' },
  { name: 'Zustand', license: 'MIT' },
  { name: 'AsyncStorage', license: 'MIT' },
  { name: 'Expo SQLite', license: 'MIT' },
  { name: 'Expo Constants', license: 'MIT' },
  { name: 'Expo Web Browser', license: 'MIT' },
  { name: 'Expo Linking', license: 'MIT' },
  { name: 'Expo Font', license: 'MIT' },
  { name: 'Expo Image Picker', license: 'MIT' },
  { name: 'Expo Image Manipulator', license: 'MIT' },
  { name: 'Expo File System', license: 'MIT' },
  { name: 'React Native Safe Area Context', license: 'MIT' },
  { name: 'React Native Gesture Handler', license: 'MIT' },
  { name: 'React Native Reanimated', license: 'MIT' },
  { name: 'React Native Toast Message', license: 'MIT' },
  { name: 'React Native UUID', license: 'MIT' },
  { name: '@expo/vector-icons (Ionicons)', license: 'MIT' },
];

export default function LicensesScreen() {
  const insets = useSafeAreaInsets();

  return (
    <>
      <Stack.Screen options={{ title: 'Licences open source' }} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
      >
        <Text style={styles.intro}>
          Cette application utilise les bibliothèques open source suivantes :
        </Text>
        {LICENSES.map((entry, index) => (
          <View
            key={entry.name}
            style={[styles.row, index === LICENSES.length - 1 && styles.rowLast]}
          >
            <Text style={styles.name}>{entry.name}</Text>
            <Text style={styles.license}>{entry.license}</Text>
          </View>
        ))}
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
    padding: spacing.base,
  },
  intro: {
    ...typography.bodySmall,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderLight,
  },
  rowLast: {
    borderBottomWidth: 0,
    borderBottomLeftRadius: borderRadius.lg,
    borderBottomRightRadius: borderRadius.lg,
  },
  name: {
    ...typography.body,
    color: colors.text,
    flex: 1,
  },
  license: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '600',
  },
});

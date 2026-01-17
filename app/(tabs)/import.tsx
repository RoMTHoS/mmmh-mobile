import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TextInput, Button } from '../../src/components/ui';

export default function ImportScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="cloud-download-outline" size={64} color="#D97706" />
        </View>
        <Text style={styles.title}>Import Recipe</Text>
        <Text style={styles.subtitle}>
          Paste a URL from Instagram, TikTok, or YouTube to extract the recipe
        </Text>
        <View style={styles.inputContainer}>
          <TextInput
            placeholder="Paste recipe URL here..."
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
        </View>
        <Button
          title="Extract Recipe"
          onPress={() => {
            // TODO: Story 2.10 - Implement URL extraction
          }}
        />
        <Text style={styles.hint}>Supported: Instagram Reels, TikTok videos, YouTube videos</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
    maxWidth: 280,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 16,
  },
  hint: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 16,
    textAlign: 'center',
  },
});

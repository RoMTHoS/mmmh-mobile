import { useState, useCallback } from 'react';
import { View, TextInput, Text, Pressable, StyleSheet, Keyboard } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Icon } from '../ui';
import { PlatformBadge } from './PlatformBadge';
import { colors, spacing, radius, fonts } from '../../theme';
import { validateVideoUrl, type Platform } from '../../utils/validation';

export type ImportType = 'video' | 'website' | 'link';

interface UrlInputProps {
  importType: ImportType;
  onSubmit: (url: string) => void;
  isLoading: boolean;
  onUrlChange?: (url: string) => void;
}

export function UrlInput({ importType, isLoading, onUrlChange }: UrlInputProps) {
  const [url, setUrl] = useState('');
  const [detectedPlatform, setDetectedPlatform] = useState<Platform | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUrlChange = useCallback(
    (text: string) => {
      setUrl(text);
      setError(null);
      onUrlChange?.(text);

      // Detect video platform for video or link import types
      if ((importType === 'video' || importType === 'link') && text.length > 10) {
        const validation = validateVideoUrl(text);
        setDetectedPlatform(validation.platform || null);
      } else {
        setDetectedPlatform(null);
      }
    },
    [importType]
  );

  const handlePaste = useCallback(async () => {
    try {
      const text = await Clipboard.getStringAsync();
      if (text) {
        handleUrlChange(text.trim());
      }
    } catch {
      // Clipboard access may fail silently
    }
  }, [handleUrlChange]);

  const getPlaceholderText = () => {
    switch (importType) {
      case 'video':
        return 'Coller le lien Instagram, TikTok ou YouTube';
      case 'link':
        return 'Coller le lien de la recette';
      default:
        return 'Coller le lien du site de recette';
    }
  };

  const placeholderText = getPlaceholderText();

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, error && styles.inputError]}
          value={url}
          onChangeText={handleUrlChange}
          placeholder={placeholderText}
          placeholderTextColor={colors.textLight}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          returnKeyType="done"
          onSubmitEditing={() => Keyboard.dismiss()}
          editable={!isLoading}
        />
        <Pressable
          onPress={handlePaste}
          style={({ pressed }) => [styles.pasteButton, pressed && styles.pasteButtonPressed]}
          disabled={isLoading}
        >
          <Icon name="clipboard" size="sm" color={colors.text} />
          <Text style={styles.pasteButtonText}>Coller</Text>
        </Pressable>
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}

      {detectedPlatform && (
        <View style={styles.platformIndicator}>
          <PlatformBadge platform={detectedPlatform} size="sm" showLabel />
          <Icon name="check" size="sm" color={colors.success} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
  },
  inputContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  inputError: {
    borderColor: colors.error,
  },
  pasteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pasteButtonPressed: {
    backgroundColor: colors.surfaceAlt,
  },
  pasteButtonText: {
    fontFamily: fonts.script,
    fontSize: 14,
    color: colors.text,
  },
  errorText: {
    color: colors.error,
    marginTop: spacing.sm,
    fontSize: 14,
  },
  platformIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    padding: spacing.sm,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.success,
  },
});

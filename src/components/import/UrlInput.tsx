import { useState, useCallback } from 'react';
import { View, TextInput, Text, Pressable, StyleSheet, Keyboard } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Icon, Button } from '../ui';
import { PlatformBadge } from './PlatformBadge';
import { colors, typography, spacing, radius, fonts } from '../../theme';
import { validateVideoUrl, isValidUrl, type Platform } from '../../utils/validation';

export type ImportType = 'video' | 'website' | 'link';

interface UrlInputProps {
  importType: ImportType;
  onSubmit: (url: string) => void;
  isLoading: boolean;
}

export function UrlInput({ importType, onSubmit, isLoading }: UrlInputProps) {
  const [url, setUrl] = useState('');
  const [detectedPlatform, setDetectedPlatform] = useState<Platform | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUrlChange = useCallback(
    (text: string) => {
      setUrl(text);
      setError(null);

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

  const handleSubmit = useCallback(() => {
    Keyboard.dismiss();

    if (!url.trim()) {
      setError('Veuillez entrer une URL');
      return;
    }

    if (importType === 'video') {
      const validation = validateVideoUrl(url);
      if (!validation.isValid) {
        setError(validation.error || 'URL de video invalide');
        return;
      }
    } else if (importType === 'link') {
      // Accept both video platform URLs and any valid HTTP URL
      if (!isValidUrl(url)) {
        setError('Veuillez entrer une URL valide');
        return;
      }
    } else {
      // Website import - any valid URL
      if (!isValidUrl(url)) {
        setError('Veuillez entrer une URL valide');
        return;
      }
    }

    onSubmit(url.trim());
  }, [url, importType, onSubmit]);

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
          returnKeyType="go"
          onSubmitEditing={handleSubmit}
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

      {(importType === 'video' || importType === 'link') &&
        !detectedPlatform &&
        url.length === 0 && (
          <View style={styles.platformHints}>
            <Text style={styles.hintsLabel}>
              {importType === 'link' ? 'Videos supportees:' : 'Plateformes supportees:'}
            </Text>
            <View style={styles.platformList}>
              <PlatformBadge platform="instagram" size="sm" showLabel />
              <PlatformBadge platform="tiktok" size="sm" showLabel />
              <PlatformBadge platform="youtube" size="sm" showLabel />
            </View>
            {importType === 'link' && (
              <Text style={[styles.hintsLabel, { marginTop: spacing.sm }]}>
                + tout site de recette
              </Text>
            )}
          </View>
        )}

      <Button
        title="Importer la recette"
        onPress={handleSubmit}
        loading={isLoading}
        disabled={!url.trim() || isLoading}
        style={styles.submitButton}
      />
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
  platformHints: {
    marginTop: spacing.lg,
  },
  hintsLabel: {
    ...typography.label,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  platformList: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  submitButton: {
    marginTop: spacing.xl,
  },
});

/**
 * Feedback form component for bug reports, feature requests, and general feedback.
 *
 * @see Story 6.2 Task 1
 */

import { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Image,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Toast } from '../../utils/toast';
import { router } from 'expo-router';
import { TextInput } from '../ui';
import { colors, typography, spacing, radius } from '../../theme';
import { analytics } from '../../services/analytics';
import { EVENTS } from '../../utils/analyticsEvents';
import {
  submitFeedback,
  gatherContext,
  encodeScreenshot,
  type FeedbackType,
} from '../../services/feedback';
import { markFeedbackSubmitted } from './FeedbackPrompt';

const FEEDBACK_TYPES: { value: FeedbackType; label: string; icon: string }[] = [
  { value: 'bug', label: 'Bug', icon: 'bug-outline' },
  { value: 'feature', label: 'Idee', icon: 'bulb-outline' },
  { value: 'general', label: 'General', icon: 'chatbubble-outline' },
];

const MIN_MESSAGE_LENGTH = 10;

export function FeedbackForm() {
  const [type, setType] = useState<FeedbackType | null>(null);
  const [message, setMessage] = useState('');
  const [url, setUrl] = useState('');
  const [screenshotUri, setScreenshotUri] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValid = type !== null && message.trim().length >= MIN_MESSAGE_LENGTH;

  const handleAttachScreenshot = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.7,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets[0]) {
        setScreenshotUri(result.assets[0].uri);
      }
    } catch {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: "Impossible d'acceder a la galerie",
      });
    }
  };

  const handleRemoveScreenshot = () => {
    setScreenshotUri(null);
  };

  const handleSubmit = async () => {
    if (!isValid || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const context = await gatherContext();

      let screenshotBase64: string | undefined;
      if (screenshotUri) {
        screenshotBase64 = await encodeScreenshot(screenshotUri);
      }

      await submitFeedback({
        type: type!,
        message: message.trim(),
        url: url.trim() || undefined,
        screenshotBase64,
        context,
      });

      analytics.track(EVENTS.FEEDBACK_SUBMITTED, {
        type,
        hasScreenshot: !!screenshotUri,
        messageLength: message.trim().length,
      });

      markFeedbackSubmitted();

      Toast.show({
        type: 'success',
        text1: 'Merci !',
        text2: 'Nous examinerons votre retour.',
      });

      setTimeout(() => {
        router.back();
      }, 1500);
    } catch {
      Toast.show({
        type: 'error',
        text1: 'Envoi echoue',
        text2: "Impossible d'envoyer le feedback. Reessayez.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={100}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Type Picker */}
        <Text style={styles.label}>Type de retour</Text>
        <View style={styles.typeRow} testID="feedback-type-picker">
          {FEEDBACK_TYPES.map((ft) => (
            <Pressable
              key={ft.value}
              style={[styles.typeChip, type === ft.value && styles.typeChipActive]}
              onPress={() => setType(ft.value)}
              testID={`feedback-type-${ft.value}`}
            >
              <Ionicons
                name={ft.icon as React.ComponentProps<typeof Ionicons>['name']}
                size={18}
                color={type === ft.value ? colors.surfaceAlt : colors.text}
              />
              <Text style={[styles.typeChipText, type === ft.value && styles.typeChipTextActive]}>
                {ft.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Message Input */}
        <TextInput
          label="Message"
          placeholder="Decrivez votre retour..."
          value={message}
          onChangeText={setMessage}
          multiline
          numberOfLines={5}
          maxLength={2000}
          error={
            message.length > 0 && message.trim().length < MIN_MESSAGE_LENGTH
              ? `Minimum ${MIN_MESSAGE_LENGTH} caracteres`
              : undefined
          }
          containerStyle={styles.messageContainer}
          testID="feedback-message-input"
        />
        <Text style={styles.charCount}>{message.trim().length} / 2000</Text>

        {/* URL Input */}
        <TextInput
          label="URL (optionnel)"
          placeholder="https://..."
          value={url}
          onChangeText={setUrl}
          keyboardType="url"
          autoCapitalize="none"
          autoCorrect={false}
          containerStyle={styles.urlContainer}
          testID="feedback-url-input"
        />

        {/* Screenshot Attach */}
        {screenshotUri ? (
          <View style={styles.screenshotPreview} testID="feedback-screenshot-preview">
            <Image source={{ uri: screenshotUri }} style={styles.screenshotImage} />
            <Pressable
              style={styles.removeScreenshot}
              onPress={handleRemoveScreenshot}
              hitSlop={8}
              testID="feedback-remove-screenshot"
            >
              <Ionicons name="close-circle" size={24} color={colors.error} />
            </Pressable>
          </View>
        ) : (
          <Pressable
            style={styles.attachButton}
            onPress={handleAttachScreenshot}
            testID="feedback-attach-screenshot"
          >
            <Ionicons name="camera-outline" size={20} color={colors.accent} />
            <Text style={styles.attachButtonText}>Joindre une capture</Text>
          </Pressable>
        )}

        {/* Submit Button */}
        <Pressable
          style={[styles.submitButton, (!isValid || isSubmitting) && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={!isValid || isSubmitting}
          testID="feedback-submit-button"
        >
          {isSubmitting ? (
            <ActivityIndicator color={colors.surfaceAlt} />
          ) : (
            <Text style={styles.submitButtonText}>Envoyer</Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.base,
    paddingBottom: spacing.xxl,
  },
  label: {
    ...typography.label,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  typeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  typeChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  typeChipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  typeChipText: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '500',
  },
  typeChipTextActive: {
    color: colors.surfaceAlt,
  },
  messageContainer: {
    marginBottom: spacing.xs,
  },
  urlContainer: {
    marginBottom: spacing.md,
  },
  charCount: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'right',
    marginBottom: spacing.md,
  },
  screenshotPreview: {
    position: 'relative',
    marginBottom: spacing.lg,
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  screenshotImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  removeScreenshot: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
  },
  attachButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    marginBottom: spacing.lg,
  },
  attachButtonText: {
    ...typography.bodySmall,
    color: colors.accent,
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    ...typography.button,
    color: colors.surfaceAlt,
  },
});

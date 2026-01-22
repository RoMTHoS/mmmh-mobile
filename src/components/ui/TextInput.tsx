import {
  TextInput as RNTextInput,
  View,
  Text,
  StyleSheet,
  TextInputProps,
  StyleProp,
  TextStyle,
  ViewStyle,
} from 'react-native';
import { colors, spacing, radius, fonts } from '../../theme';

type InputVariant = 'default' | 'pill';

interface Props extends TextInputProps {
  error?: string;
  label?: string;
  variant?: InputVariant;
  useScriptLabel?: boolean;
  style?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
}

export function TextInput({
  error,
  label,
  variant = 'default',
  useScriptLabel = false,
  style,
  containerStyle,
  ...props
}: Props) {
  return (
    <View style={containerStyle}>
      {label && <Text style={[styles.label, useScriptLabel && styles.scriptLabel]}>{label}</Text>}
      <RNTextInput
        style={[
          styles.input,
          variant === 'pill' && styles.pill,
          props.multiline && styles.multiline,
          error && styles.inputError,
          style,
        ]}
        placeholderTextColor={colors.textLight}
        accessibilityLabel={label}
        accessibilityHint={error ? `Erreur: ${error}` : undefined}
        {...props}
      />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  scriptLabel: {
    fontFamily: fonts.script,
    fontSize: 16,
    fontWeight: undefined,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface,
    minHeight: 44,
  },
  pill: {
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
  },
  multiline: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: spacing.sm + 4,
  },
  inputError: {
    borderColor: colors.error,
  },
  error: {
    color: colors.error,
    fontSize: 12,
    marginTop: spacing.xs,
  },
});

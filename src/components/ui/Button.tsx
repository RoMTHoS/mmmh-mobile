import { Pressable, Text, ActivityIndicator, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { colors, fonts, spacing, radius } from '../../theme';

type Variant = 'primary' | 'secondary' | 'outline' | 'destructive';
type Size = 'sm' | 'md' | 'lg';

interface Props {
  title: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  useScriptFont?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  useScriptFont = true,
  style,
}: Props) {
  const isDisabled = disabled || loading;

  const sizeStyles = {
    sm: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, minHeight: 36 },
    md: { paddingVertical: spacing.sm + 4, paddingHorizontal: spacing.lg, minHeight: 44 },
    lg: { paddingVertical: spacing.md, paddingHorizontal: spacing.xl, minHeight: 52 },
  };

  const textSizes = {
    sm: 14,
    md: 16,
    lg: 18,
  };

  const getPressedStyle = (pressed: boolean) => {
    if (!pressed) return null;
    if (variant === 'primary') return styles.primaryPressed;
    return styles.pressed;
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        sizeStyles[size],
        styles[variant],
        getPressedStyle(pressed),
        isDisabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? colors.surface : colors.accent} />
      ) : (
        <Text
          style={[
            styles.text,
            { fontSize: textSizes[size] },
            useScriptFont && styles.scriptText,
            styles[`${variant}Text` as keyof typeof styles],
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: colors.accent,
  },
  secondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.accent,
  },
  destructive: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: colors.error,
  },
  pressed: {
    opacity: 0.85,
  },
  primaryPressed: {
    backgroundColor: colors.accentLight,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontWeight: '600',
  },
  scriptText: {
    fontFamily: fonts.script,
    fontWeight: undefined,
  },
  primaryText: {
    color: colors.surface,
  },
  secondaryText: {
    color: colors.text,
  },
  outlineText: {
    color: colors.accent,
  },
  destructiveText: {
    color: colors.error,
  },
});

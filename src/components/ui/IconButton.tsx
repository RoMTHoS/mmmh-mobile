import { Pressable, StyleSheet } from 'react-native';
import { Icon, IconName, IconSize } from './Icon';
import { colors, spacing, radius } from '../../theme';

interface Props {
  icon: IconName;
  onPress: () => void;
  color?: string;
  size?: IconSize | number;
  disabled?: boolean;
  accessibilityLabel?: string;
}

export function IconButton({
  icon,
  onPress,
  color = colors.accent,
  size = 'lg',
  disabled = false,
  accessibilityLabel,
}: Props) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Icon name={icon} size={size} color={color} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: spacing.sm,
    borderRadius: radius.sm,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
    backgroundColor: colors.surfaceAlt,
  },
  disabled: {
    opacity: 0.4,
  },
});

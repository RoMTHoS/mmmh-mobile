import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

interface SettingsRowProps {
  icon: IconName;
  title: string;
  subtitle?: string;
  value?: string;
  onPress?: () => void;
  isLast?: boolean;
  destructive?: boolean;
  disabled?: boolean;
  testID?: string;
  rightElement?: React.ReactNode;
}

export function SettingsRow({
  icon,
  title,
  subtitle,
  value,
  onPress,
  isLast,
  destructive,
  disabled,
  testID,
  rightElement,
}: SettingsRowProps) {
  const titleColor = destructive ? colors.error : disabled ? colors.textMuted : colors.text;
  const iconColor = destructive ? colors.error : colors.accent;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.item,
        isLast && styles.itemLast,
        pressed && onPress && styles.itemPressed,
      ]}
      onPress={onPress}
      disabled={!onPress || disabled}
      testID={testID}
    >
      <View style={[styles.itemIcon, destructive && styles.itemIconDestructive]}>
        <Ionicons name={icon} size={22} color={iconColor} />
      </View>
      <View style={styles.itemContent}>
        <Text style={[styles.itemTitle, { color: titleColor }]}>{title}</Text>
        {subtitle && <Text style={styles.itemSubtitle}>{subtitle}</Text>}
      </View>
      {rightElement}
      {value && <Text style={styles.itemValue}>{value}</Text>}
      {onPress && !rightElement && (
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.base,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderLight,
  },
  itemLast: {
    borderBottomWidth: 0,
  },
  itemPressed: {
    backgroundColor: colors.background,
  },
  itemIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  itemIconDestructive: {
    backgroundColor: '#FEF2F2',
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    ...typography.body,
    color: colors.text,
  },
  itemSubtitle: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  itemValue: {
    ...typography.caption,
    color: colors.textMuted,
    marginRight: spacing.xs,
  },
});

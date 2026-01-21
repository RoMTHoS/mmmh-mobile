import { View, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { colors, spacing, radius, typography } from '../../theme';
import { Icon, IconName } from './Icon';

interface Props {
  icon?: IconName;
  value: string;
  style?: StyleProp<ViewStyle>;
}

export function Badge({ icon, value, style }: Props) {
  return (
    <View style={[styles.badge, style]}>
      {icon && <Icon name={icon} size="sm" color={colors.text} />}
      <Text style={styles.text}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 2,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  text: {
    ...typography.bodySmall,
    color: colors.text,
  },
});

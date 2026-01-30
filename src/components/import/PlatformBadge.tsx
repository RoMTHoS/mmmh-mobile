import { View, Text, StyleSheet } from 'react-native';
import { Icon, IconName } from '../ui';
import { colors, typography, spacing } from '../../theme';
import type { Platform } from '../../utils/validation';

interface PlatformBadgeProps {
  platform?: Platform | string | null;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const PLATFORM_CONFIG: Record<string, { icon: IconName; label: string; color: string }> = {
  instagram: { icon: 'instagram', label: 'Instagram', color: '#E4405F' },
  tiktok: { icon: 'tiktok', label: 'TikTok', color: '#000000' },
  youtube: { icon: 'youtube', label: 'YouTube', color: '#FF0000' },
};

export function PlatformBadge({ platform, size = 'md', showLabel = false }: PlatformBadgeProps) {
  if (!platform) {
    return (
      <View style={[styles.badge, styles[size]]}>
        <Icon name="globe" size={size} color={colors.textMuted} />
        {showLabel && <Text style={styles.label}>Website</Text>}
      </View>
    );
  }

  const config = PLATFORM_CONFIG[platform.toLowerCase()];
  if (!config) {
    return (
      <View style={[styles.badge, styles[size]]}>
        <Icon name="globe" size={size} color={colors.textMuted} />
        {showLabel && <Text style={styles.label}>{platform}</Text>}
      </View>
    );
  }

  return (
    <View style={[styles.badge, styles[size]]}>
      <Icon name={config.icon} size={size} color={config.color} />
      {showLabel && <Text style={[styles.label, { color: config.color }]}>{config.label}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  sm: {
    padding: spacing.xs,
  },
  md: {
    padding: spacing.sm,
  },
  lg: {
    padding: spacing.md,
  },
  label: {
    ...typography.label,
    color: colors.text,
  },
});

import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts, spacing, radius } from '../../theme';

type PipelineType = 'vps' | 'gemini';

interface PipelineBadgeProps {
  pipeline: PipelineType;
  /** Optional size variant. Defaults to 'sm'. */
  size?: 'sm' | 'md';
}

/**
 * Displays a badge indicating which pipeline is used for an import.
 * - "Standard" (VPS): gray/navy outline
 * - "Premium" (Gemini): gold-filled with star
 */
export function PipelineBadge({ pipeline, size = 'sm' }: PipelineBadgeProps) {
  const isPremium = pipeline === 'gemini';

  return (
    <View
      style={[
        styles.badge,
        size === 'md' && styles.badgeMd,
        isPremium ? styles.premiumBadge : styles.standardBadge,
      ]}
      testID={`pipeline-badge-${isPremium ? 'premium' : 'standard'}`}
    >
      <Text
        style={[
          styles.text,
          size === 'md' && styles.textMd,
          isPremium ? styles.premiumText : styles.standardText,
        ]}
      >
        {isPremium ? '\u2605 Premium' : 'Standard'}
      </Text>
    </View>
  );
}

const GOLD = '#D4A017';

const styles = StyleSheet.create({
  badge: {
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  badgeMd: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  standardBadge: {
    borderColor: colors.textMuted,
    backgroundColor: 'transparent',
  },
  premiumBadge: {
    borderColor: GOLD,
    backgroundColor: GOLD,
  },
  text: {
    fontSize: 11,
    fontFamily: fonts.script,
  },
  textMd: {
    fontSize: 13,
  },
  standardText: {
    color: colors.textMuted,
  },
  premiumText: {
    color: '#FFFFFF',
  },
});

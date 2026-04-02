import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { colors, spacing, fonts } from '../../theme';
import { Icon } from '../ui';
import { PlanComparisonTable } from '../import/PlanComparisonTable';

export function PlanComparisonSlide() {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  return (
    <View style={[styles.container, { width }]}>
      <Text style={[styles.title, !isTablet && styles.titleMobile]}>Standard vs Premium</Text>
      <PlanComparisonTable />

      {/* CTA at bottom */}
      <View style={styles.ctaRow}>
        <Text style={styles.ctaText}>Voir la difference</Text>
        <View style={styles.ctaArrow}>
          <Icon name="arrow-left" size="md" color={colors.accent} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontFamily: fonts.script,
    fontSize: 32,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  titleMobile: {
    fontSize: 24,
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xl,
  },
  ctaArrow: {
    transform: [{ scaleX: -1 }],
  },
  ctaText: {
    fontFamily: fonts.script,
    fontSize: 18,
    color: colors.accent,
  },
});

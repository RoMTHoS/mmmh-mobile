import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { colors, spacing, fonts, radius } from '../../theme';

interface FeatureRowProps {
  label: string;
  standard: string;
  premium: string;
  small: boolean;
}

function FeatureRow({ label, standard, premium, small }: FeatureRowProps) {
  return (
    <View style={rowStyles.container}>
      <Text style={[rowStyles.label, small && rowStyles.labelSmall]}>{label}</Text>
      <View style={rowStyles.values}>
        <Text style={[rowStyles.standard, small && rowStyles.standardSmall]}>{standard}</Text>
        <Text style={[rowStyles.premium, small && rowStyles.premiumSmall]}>{premium}</Text>
      </View>
    </View>
  );
}

export function PlanComparisonTable() {
  const { width } = useWindowDimensions();
  const small = width < 768;

  return (
    <View style={styles.wrapper}>
      {/* Column headers */}
      <View style={styles.headerRow}>
        <View style={styles.headerLabel} />
        <View style={styles.headerValues}>
          <Text style={[styles.headerStandard, small && styles.headerSmall]}>Standard</Text>
          <Text style={[styles.headerPremium, small && styles.headerSmall]}>Premium</Text>
        </View>
      </View>

      {/* Feature rows */}
      <View style={styles.card}>
        <FeatureRow
          label="Importation des recettes"
          standard="Lente"
          premium="Instantane"
          small={small}
        />
        <FeatureRow label="File d'attente" standard="Oui" premium="Prioritaire" small={small} />
        <FeatureRow label="Qualite de l'IA" standard="Bonne" premium="Excellente" small={small} />
        <FeatureRow
          label="Precision des recettes"
          standard="Correcte"
          premium="Optimale"
          small={small}
        />
        <FeatureRow
          label="Ingredients detectes"
          standard="Partiel"
          premium="Complet"
          small={small}
        />
        <FeatureRow
          label="Quantites & unites"
          standard="Approximatif"
          premium="Precis"
          small={small}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  headerLabel: {
    flex: 1.2,
  },
  headerValues: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  headerStandard: {
    fontFamily: fonts.script,
    fontSize: 17,
    color: colors.textMuted,
    textAlign: 'center',
    flex: 1,
  },
  headerPremium: {
    fontFamily: fonts.script,
    fontSize: 17,
    color: '#D4A017',
    textAlign: 'center',
    flex: 1,
  },
  headerSmall: {
    fontSize: 13,
  },
  card: {
    width: '100%',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
});

const rowStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border + '40',
  },
  label: {
    flex: 1.2,
    fontFamily: fonts.script,
    fontSize: 17,
    color: colors.text,
  },
  labelSmall: {
    fontSize: 13,
  },
  values: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  standard: {
    fontFamily: fonts.script,
    fontSize: 16,
    color: colors.textMuted,
    textAlign: 'center',
    flex: 1,
  },
  standardSmall: {
    fontSize: 12,
  },
  premium: {
    fontFamily: fonts.script,
    fontSize: 16,
    color: '#D4A017',
    fontWeight: '600',
    textAlign: 'center',
    flex: 1,
  },
  premiumSmall: {
    fontSize: 12,
  },
});

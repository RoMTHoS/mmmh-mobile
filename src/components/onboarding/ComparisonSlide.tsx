import { View, Text, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { colors, spacing, fonts, radius } from '../../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const STANDARD_RECIPE = {
  title: 'Poulet rôti aux herbes',
  ingredients: ['poulet', 'herbes de provence', 'huile olive', 'pommes de terre', 'sel, poivre'],
  steps: [
    'Préchauffer le four à 200°C.',
    'Préparer le poulet avec les herbes.',
    'Enfourner pendant 1h30.',
  ],
};

const PREMIUM_RECIPE = {
  title: 'Poulet rôti aux herbes de Provence',
  cookingTime: '1h45',
  servings: '4',
  kcal: '380',
  ingredients: [
    { qty: '1,5 kg', name: 'poulet fermier entier' },
    { qty: '2 c.à.s', name: 'herbes de Provence' },
    { qty: '3 c.à.s', name: "huile d'olive extra vierge" },
    { qty: '800 g', name: 'pommes de terre grenaille' },
    { qty: '1', name: 'citron (jus et zeste)' },
    { qty: '6', name: "gousses d'ail en chemise" },
  ],
  steps: [
    'Préchauffer le four à 200°C (chaleur tournante).',
    "Badigeonner le poulet d'huile d'olive, frotter avec les herbes, le sel et le poivre. Glisser le demi-citron pressé dans la cavité.",
    "Disposer les pommes de terre et l'ail autour du poulet dans un plat à rôtir.",
    'Enfourner 1h30, arroser toutes les 30 minutes avec le jus de cuisson.',
    'Laisser reposer 15 minutes avant de découper. Servir avec le jus de cuisson.',
  ],
};

function RecipePreview({ isStandard }: { isStandard: boolean }) {
  const recipe = isStandard ? STANDARD_RECIPE : PREMIUM_RECIPE;

  return (
    <View style={previewStyles.container}>
      <ScrollView
        style={previewStyles.scroll}
        contentContainerStyle={previewStyles.scrollContent}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
      >
        {/* Title */}
        <Text style={previewStyles.title}>{recipe.title}</Text>

        {/* Metadata badges (premium only) */}
        {!isStandard && (
          <View style={previewStyles.badgeRow}>
            <View style={previewStyles.badge}>
              <Text style={previewStyles.badgeText}>⏱ {PREMIUM_RECIPE.cookingTime}</Text>
            </View>
            <View style={previewStyles.badge}>
              <Text style={previewStyles.badgeText}>👤 {PREMIUM_RECIPE.servings} pers.</Text>
            </View>
            <View style={previewStyles.badge}>
              <Text style={previewStyles.badgeText}>🔥 {PREMIUM_RECIPE.kcal} kcal</Text>
            </View>
          </View>
        )}

        {/* Ingredients */}
        <Text style={previewStyles.sectionTitle}>Ingrédients</Text>
        {isStandard
          ? STANDARD_RECIPE.ingredients.map((ing, i) => (
              <Text key={i} style={previewStyles.ingredientSimple}>
                • {ing}
              </Text>
            ))
          : PREMIUM_RECIPE.ingredients.map((ing, i) => (
              <View key={i} style={previewStyles.ingredientRow}>
                <Text style={previewStyles.ingredientQty}>{ing.qty}</Text>
                <Text style={previewStyles.ingredientName}>{ing.name}</Text>
              </View>
            ))}

        {/* Instructions */}
        <Text style={previewStyles.sectionTitle}>Instructions</Text>
        {recipe.steps.map((step, i) => (
          <View key={i} style={previewStyles.stepRow}>
            <Text style={previewStyles.stepNumber}>{i + 1}.</Text>
            <Text style={previewStyles.stepText}>{step}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

export function ComparisonSlide() {
  return (
    <View style={styles.container} testID="onboarding-slide">
      {/* Standard label */}
      <Text style={styles.tierLabel}>Standard</Text>

      {/* Standard preview */}
      <RecipePreview isStandard />

      {/* VS */}
      <Text style={styles.vsText}>VS</Text>

      {/* Premium preview */}
      <RecipePreview isStandard={false} />

      {/* Premium label */}
      <Text style={[styles.tierLabel, styles.premiumLabel]}>Premium</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
  },
  tierLabel: {
    fontFamily: fonts.script,
    fontSize: 18,
    color: colors.textMuted,
  },
  premiumLabel: {
    color: '#D4A017',
  },
  vsText: {
    fontFamily: fonts.script,
    fontSize: 16,
    color: colors.textMuted,
  },
});

const previewStyles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    overflow: 'hidden',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
  },
  title: {
    fontFamily: fonts.script,
    fontSize: 16,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.sm,
    flexWrap: 'wrap',
  },
  badge: {
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badgeText: {
    fontFamily: fonts.sans,
    fontSize: 11,
    color: colors.textMuted,
  },
  sectionTitle: {
    fontFamily: fonts.script,
    fontSize: 14,
    color: colors.text,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  ingredientSimple: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.text,
    lineHeight: 18,
  },
  ingredientRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: 2,
  },
  ingredientQty: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.accent,
    fontWeight: '600',
    width: 50,
  },
  ingredientName: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.text,
    flex: 1,
  },
  stepRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: 4,
  },
  stepNumber: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.accent,
    fontWeight: '600',
  },
  stepText: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.text,
    flex: 1,
    lineHeight: 17,
  },
});

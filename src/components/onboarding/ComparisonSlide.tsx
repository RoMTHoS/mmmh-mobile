import { View, Text, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { colors, spacing, fonts, radius } from '../../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const STANDARD_RECIPE = {
  title: 'Assiette de Tartare de Truite',
  servings: null as number | null,
  ingredients: [
    { name: 'feuille de riz', quantity: null, unit: null },
    { name: "jaune d'œuf", quantity: '1', unit: null },
    { name: 'filet de truit', quantity: null, unit: null },
    { name: 'kiwi gold', quantity: '1', unit: null },
    { name: 'échalote', quantity: null, unit: null },
    { name: 'coriandre', quantity: null, unit: null },
    { name: 'sauce soja', quantity: null, unit: null },
    { name: 'huile de sésame', quantity: null, unit: null },
    { name: 'nuoc mam', quantity: null, unit: null },
    { name: 'sésame noir et doré', quantity: '0.5', unit: null },
    { name: 'poivre', quantity: '1', unit: null },
  ],
  steps: [
    "Prenez une feuille de riz et un jaune d'œuf.",
    'Faites frire la feuille de riz.',
    'Émincer les échalotes finement.',
    'Couper le filet de truite en gros dés.',
    'Éplucher et couper les kiwis en petits cubes.',
    'Mélanger tous les ingrédients et assaisonner avec huile de sésame, citron et poivre.',
    "Servez le tartare sur la feuille de riz avec le jaune d'œuf au-dessus.",
  ],
};

const PREMIUM_RECIPE = {
  title: 'Tartare de Truite sur Feuille de Riz Frit',
  servings: 2,
  ingredients: [
    { name: 'Filet de truite', quantity: '180', unit: 'g' },
    { name: 'Échalote', quantity: '1', unit: 'pièce' },
    { name: 'Kiwi gold', quantity: '1', unit: 'pièce' },
    { name: 'Coriandre fraîche', quantity: '15', unit: 'g' },
    { name: 'Zeste de citron vert', quantity: '1', unit: null },
    { name: 'Huile de sésame', quantity: '1', unit: 'c.à.s' },
    { name: 'Sauce soja', quantity: '2', unit: 'c.à.s' },
    { name: 'Nuoc-mâm', quantity: '1', unit: 'c.à.c' },
    { name: 'Feuille de riz', quantity: '1', unit: 'feuille' },
    { name: "Jaune d'œuf", quantity: '1', unit: 'jaune' },
    { name: 'Huile pour friture', quantity: '200', unit: 'ml' },
    { name: 'Graines de sésame', quantity: '1', unit: 'c.à.c' },
  ],
  steps: [
    'Lever la peau et les arêtes du filet de truite fraîche.',
    'Tailler le filet de truite en longs rubans, puis en dés.',
    "Ciseler finement l'échalote.",
    'Peler et tailler le kiwi gold en dés.',
    'Hacher la coriandre fraîche.',
    "Mélanger les dés de truite, l'échalote, le kiwi et la coriandre.",
    "Ajouter le zeste de citron vert, l'huile de sésame, la sauce soja, le nuoc-mâm et le poivre.",
    "Chauffer l'huile de friture à 180°C.",
    "Frire la feuille de riz avec un jaune d'œuf au centre.",
    'Déposer le tartare sur la feuille croustillante, saupoudrer de sésame.',
  ],
};

interface RecipeData {
  title: string;
  servings: number | null;
  ingredients: { name: string; quantity: string | null; unit: string | null }[];
  steps: string[];
}

function RecipePreview({ recipe }: { recipe: RecipeData }) {
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

        {/* Servings badge */}
        {recipe.servings != null && (
          <View style={previewStyles.metaRow}>
            <View style={previewStyles.badge}>
              <Text style={previewStyles.badgeText}>👤 {recipe.servings} pers.</Text>
            </View>
          </View>
        )}

        {/* Ingredients */}
        <Text style={previewStyles.sectionTitle}>Ingrédients</Text>
        {recipe.ingredients.map((ing, i) => {
          const qty = [ing.quantity, ing.unit].filter(Boolean).join(' ');
          return (
            <View key={i} style={previewStyles.ingredientRow}>
              <Text style={previewStyles.ingredientName} numberOfLines={1}>
                {ing.name}
              </Text>
              {qty ? <Text style={previewStyles.ingredientQty}>{qty}</Text> : null}
            </View>
          );
        })}

        {/* Instructions */}
        <Text style={previewStyles.sectionTitle}>Instructions</Text>
        {recipe.steps.map((step, i) => (
          <View key={i} style={previewStyles.stepRow}>
            <View style={previewStyles.stepCircle}>
              <Text style={previewStyles.stepNumber}>{i + 1}</Text>
            </View>
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
      <Text style={styles.tierLabel}>Standard</Text>
      <RecipePreview recipe={STANDARD_RECIPE} />
      <Text style={styles.vsText}>VS</Text>
      <RecipePreview recipe={PREMIUM_RECIPE} />
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
    marginBottom: spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
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
  ingredientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border + '30',
  },
  ingredientName: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.text,
    flex: 1,
  },
  ingredientQty: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.text,
    textAlign: 'right',
    marginLeft: spacing.sm,
  },
  stepRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.xs,
    alignItems: 'flex-start',
  },
  stepCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.text,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
  },
  stepNumber: {
    fontFamily: fonts.sans,
    color: colors.background,
    fontSize: 10,
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

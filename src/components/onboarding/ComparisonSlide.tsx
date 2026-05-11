import { View, Text, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import { colors, spacing, fonts, radius } from '../../theme';

const STANDARD_RECIPE = {
  title: 'Paella aux fruits de mer',
  servings: null as number | null,
  ingredients: [
    { name: 'riz rond', quantity: null, unit: null },
    { name: 'crevettes', quantity: null, unit: null },
    { name: 'moules', quantity: null, unit: null },
    { name: 'calamars', quantity: null, unit: null },
    { name: 'oignon', quantity: null, unit: null },
    { name: 'ail', quantity: null, unit: null },
    { name: 'poivron rouge', quantity: null, unit: null },
    { name: 'petits pois', quantity: null, unit: null },
    { name: 'tomates', quantity: null, unit: null },
    { name: 'bouillon de poisson', quantity: null, unit: null },
    { name: 'safran', quantity: null, unit: null },
    { name: 'paprika', quantity: null, unit: null },
    { name: "huile d'olive", quantity: null, unit: null },
    { name: 'citron', quantity: null, unit: null },
    { name: 'coriandre', quantity: null, unit: null },
  ],
  steps: [
    "Faire revenir l'oignon et l'ail.",
    'Ajouter le poivron et les calamars.',
    'Ajouter les tomates et les épices.',
    'Verser le riz et le bouillon.',
    'Cuire et ajouter les crevettes et moules.',
    'Laisser reposer et servir.',
  ],
};

const PREMIUM_RECIPE = {
  title: 'Paella aux fruits de mer',
  servings: 6 as number | null,
  ingredients: [
    { name: 'Riz rond (bomba)', quantity: '400', unit: 'g' },
    { name: 'Crevettes entières', quantity: '12', unit: null },
    { name: 'Moules', quantity: '500', unit: 'g' },
    { name: 'Calamars en anneaux', quantity: '200', unit: 'g' },
    { name: 'Oignon', quantity: '1', unit: null },
    { name: 'Ail', quantity: '2', unit: 'gousses' },
    { name: 'Poivron rouge', quantity: '1', unit: null },
    { name: 'Petits pois', quantity: '150', unit: 'g' },
    { name: 'Tomates concassées', quantity: '400', unit: 'g' },
    { name: 'Bouillon de poisson', quantity: '1', unit: 'L' },
    { name: 'Safran', quantity: '1', unit: 'dose' },
    { name: 'Paprika fumé', quantity: '1', unit: 'c.à.c' },
    { name: "Huile d'olive", quantity: '4', unit: 'c.à.s' },
    { name: 'Citron', quantity: '1', unit: null },
    { name: 'Coriandre fraîche', quantity: '1', unit: 'bouquet' },
  ],
  steps: [
    "Chauffer l'huile d'olive dans une grande poêle à paella. Faire revenir l'oignon émincé et l'ail haché 3 minutes.",
    'Ajouter le poivron coupé en lanières et cuire 2 minutes. Ajouter les calamars et les saisir 2 minutes.',
    'Incorporer les tomates concassées, le paprika fumé et le safran. Cuire 5 minutes en remuant.',
    "Verser le riz et mélanger pour bien l'enrober. Ajouter le bouillon de poisson chaud d'un coup.",
    'Laisser cuire 10 minutes à feu moyen sans remuer. Disposer les crevettes et les moules sur le riz.',
    "Ajouter les petits pois, baisser le feu et cuire encore 10 minutes jusqu'à absorption du bouillon.",
    "Couvrir d'un torchon et laisser reposer 5 minutes. Servir avec la coriandre ciselée et des quartiers de citron.",
  ],
};

interface RecipeData {
  title: string;
  servings: number | null;
  ingredients: { name: string; quantity: string | null; unit: string | null }[];
  steps: string[];
}

function RecipePreview({ recipe, isTablet }: { recipe: RecipeData; isTablet: boolean }) {
  return (
    <View style={previewStyles.container}>
      <ScrollView
        style={previewStyles.scroll}
        contentContainerStyle={previewStyles.scrollContent}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
      >
        {/* Title */}
        <Text style={[previewStyles.title, isTablet && { fontSize: 22 }]}>{recipe.title}</Text>

        {/* Servings badge */}
        {recipe.servings != null && (
          <View style={previewStyles.metaRow}>
            <View style={previewStyles.badge}>
              <Text style={[previewStyles.badgeText, isTablet && { fontSize: 14 }]}>
                👤 {recipe.servings} pers.
              </Text>
            </View>
          </View>
        )}

        {/* Ingredients */}
        <Text style={[previewStyles.sectionTitle, isTablet && { fontSize: 19 }]}>Ingrédients</Text>
        {recipe.ingredients.map((ing, i) => {
          const qty = [ing.quantity, ing.unit].filter(Boolean).join(' ');
          return (
            <View key={i} style={[previewStyles.ingredientRow, isTablet && { paddingVertical: 6 }]}>
              <Text
                style={[previewStyles.ingredientName, isTablet && { fontSize: 16 }]}
                numberOfLines={1}
              >
                {ing.name}
              </Text>
              {qty ? (
                <Text style={[previewStyles.ingredientQty, isTablet && { fontSize: 16 }]}>
                  {qty}
                </Text>
              ) : null}
            </View>
          );
        })}

        {/* Instructions */}
        <Text style={[previewStyles.sectionTitle, isTablet && { fontSize: 19 }]}>Instructions</Text>
        {recipe.steps.map((step, i) => (
          <View key={i} style={previewStyles.stepRow}>
            <View
              style={[
                previewStyles.stepCircle,
                isTablet && { width: 24, height: 24, borderRadius: 12 },
              ]}
            >
              <Text style={[previewStyles.stepNumber, isTablet && { fontSize: 13 }]}>{i + 1}</Text>
            </View>
            <Text style={[previewStyles.stepText, isTablet && { fontSize: 16, lineHeight: 22 }]}>
              {step}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

export function ComparisonSlide() {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  return (
    <View style={[styles.container, { width }]} testID="onboarding-slide">
      <View style={styles.previewsWrapper}>
        <View style={styles.previewBlock}>
          <Text style={styles.tierLabel}>Standard</Text>
          <RecipePreview recipe={STANDARD_RECIPE} isTablet={isTablet} />
        </View>
        <View style={styles.previewBlock}>
          <Text style={[styles.tierLabel, styles.premiumLabel]}>Premium</Text>
          <RecipePreview recipe={PREMIUM_RECIPE} isTablet={isTablet} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  previewsWrapper: {
    flex: 1,
    width: '100%',
    maxWidth: 500,
    gap: spacing.sm,
  },
  previewBlock: {
    flex: 1,
    gap: spacing.xs,
  },
  tierLabel: {
    fontFamily: fonts.script,
    fontSize: 22,
    color: colors.textMuted,
  },
  premiumLabel: {
    color: '#D4A017',
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
    fontSize: 18,
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
    fontSize: 16,
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
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  ingredientQty: {
    fontFamily: fonts.sans,
    fontSize: 14,
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
    fontSize: 14,
    color: colors.text,
    flex: 1,
    lineHeight: 19,
  },
});

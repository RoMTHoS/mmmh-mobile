import type { ShoppingListItem, IngredientCategoryCode } from '../types';
import { INGREDIENT_CATEGORIES } from '../types';

function formatItemLine(item: ShoppingListItem): string {
  const check = item.isChecked ? '\u2611' : '\u2610';
  let line = `${check} ${item.name}`;
  if (item.quantity != null) {
    line += ` \u00d7 ${item.quantity}`;
    if (item.unit) line += item.unit;
  }
  return line;
}

export function exportShoppingListAsText(items: ShoppingListItem[], recipeCount: number): string {
  const lines: string[] = [];
  lines.push(`\uD83D\uDED2 Liste de courses (${recipeCount} recette${recipeCount > 1 ? 's' : ''})`);
  lines.push('');

  // Group items by category
  const groups: Partial<Record<IngredientCategoryCode, ShoppingListItem[]>> = {};
  for (const item of items) {
    const cat = item.category ?? 'other';
    if (!groups[cat]) groups[cat] = [];
    groups[cat]!.push(item);
  }

  const orderedKeys = Object.keys(INGREDIENT_CATEGORIES) as IngredientCategoryCode[];

  for (const key of orderedKeys) {
    const groupItems = groups[key];
    if (!groupItems || groupItems.length === 0) continue;

    lines.push(`${INGREDIENT_CATEGORIES[key]} :`);
    for (const item of groupItems) {
      lines.push(formatItemLine(item));
    }
    lines.push('');
  }

  return lines.join('\n').trimEnd();
}

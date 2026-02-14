import { exportShoppingListAsText } from '../../src/utils/shoppingListExport';
import type { ShoppingListItem } from '../../src/types';

function createItem(overrides: Partial<ShoppingListItem> = {}): ShoppingListItem {
  return {
    id: 'item-1',
    shoppingListId: 'list-1',
    name: 'Banane',
    quantity: 3,
    unit: null,
    category: 'produce',
    sourceType: 'recipe',
    sourceRecipeIds: ['r1'],
    isChecked: false,
    isExcluded: false,
    checkedAt: null,
    estimatedPrice: null,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('exportShoppingListAsText', () => {
  it('exports header with recipe count', () => {
    const result = exportShoppingListAsText([], 3);
    expect(result).toContain('Liste de courses (3 recettes)');
  });

  it('uses singular for 1 recipe', () => {
    const result = exportShoppingListAsText([], 1);
    expect(result).toContain('(1 recette)');
    expect(result).not.toContain('recettes');
  });

  it('groups items by category with French labels', () => {
    const items = [
      createItem({ id: '1', name: 'Banane', category: 'produce' }),
      createItem({ id: '2', name: 'Yaourt', category: 'dairy' }),
    ];

    const result = exportShoppingListAsText(items, 2);
    expect(result).toContain('Fruits et légumes :');
    expect(result).toContain('Produits laitiers :');
  });

  it('shows unchecked and checked items with correct symbols', () => {
    const items = [
      createItem({ id: '1', name: 'Banane', isChecked: false }),
      createItem({ id: '2', name: 'Pomme', isChecked: true }),
    ];

    const result = exportShoppingListAsText(items, 1);
    expect(result).toContain('\u2610 Banane');
    expect(result).toContain('\u2611 Pomme');
  });

  it('formats quantity and unit correctly', () => {
    const items = [
      createItem({ id: '1', name: 'Farine', quantity: 500, unit: 'g', category: 'pantry' }),
    ];

    const result = exportShoppingListAsText(items, 1);
    expect(result).toContain('Farine \u00d7 500g');
  });

  it('formats quantity without unit', () => {
    const items = [
      createItem({ id: '1', name: 'Oeuf', quantity: 6, unit: null, category: 'other' }),
    ];

    const result = exportShoppingListAsText(items, 1);
    expect(result).toContain('Oeuf \u00d7 6');
  });

  it('omits quantity when null', () => {
    const items = [createItem({ id: '1', name: 'Sel', quantity: null, category: 'pantry' })];

    const result = exportShoppingListAsText(items, 1);
    expect(result).toContain('\u2610 Sel');
    expect(result).not.toContain('\u00d7');
  });

  it('handles empty items array', () => {
    const result = exportShoppingListAsText([], 0);
    expect(result).toContain('Liste de courses');
  });

  it('does not include empty categories', () => {
    const items = [createItem({ id: '1', name: 'Banane', category: 'produce' })];

    const result = exportShoppingListAsText(items, 1);
    expect(result).toContain('Fruits et légumes :');
    expect(result).not.toContain('Produits laitiers :');
    expect(result).not.toContain('Viandes :');
  });
});

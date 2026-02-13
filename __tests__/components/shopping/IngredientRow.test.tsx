import type { ShoppingListItem } from '../../../src/types';
import { IngredientRow } from '../../../src/components/shopping/IngredientRow';

const mockItem = (overrides?: Partial<ShoppingListItem>): ShoppingListItem => ({
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
});

describe('IngredientRow', () => {
  const mockToggle = jest.fn();
  const mockDelete = jest.fn();
  const mockEdit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('exports the component', () => {
    expect(IngredientRow).toBeDefined();
    expect(typeof IngredientRow).toBe('function');
  });

  it('renders without swipe when onDelete is absent', () => {
    const element = IngredientRow({ item: mockItem(), onToggle: mockToggle });
    expect(element).toBeDefined();
    expect(element.props.testID).toBe('ingredient-row-item-1');
  });

  it('wraps in SwipeableWrapper when onDelete is provided', () => {
    const element = IngredientRow({
      item: mockItem(),
      onToggle: mockToggle,
      onDelete: mockDelete,
    });
    expect(element).toBeDefined();
    // Returns a SwipeableWrapper element (not the Pressable directly)
    expect(element.type).not.toBe('Pressable');
    // The wrapper receives the itemId and onDelete
    expect(element.props.itemId).toBe('item-1');
    expect(element.props.onDelete).toBe(mockDelete);
  });

  it('renders with quantity and unit', () => {
    const item = mockItem({ quantity: 200, unit: 'g' });
    const element = IngredientRow({ item, onToggle: mockToggle });
    expect(element).toBeDefined();
  });

  it('renders without quantity when null', () => {
    const item = mockItem({ quantity: null, unit: null });
    const element = IngredientRow({ item, onToggle: mockToggle });
    expect(element).toBeDefined();
  });

  it('applies checked styling when isChecked is true', () => {
    const item = mockItem({ isChecked: true });
    const element = IngredientRow({ item, onToggle: mockToggle });
    // Without onDelete, the Pressable is returned directly
    expect(element.props.accessibilityState.checked).toBe(true);
  });

  it('applies unchecked state when isChecked is false', () => {
    const item = mockItem({ isChecked: false });
    const element = IngredientRow({ item, onToggle: mockToggle });
    expect(element.props.accessibilityState.checked).toBe(false);
  });

  it('has checkbox accessibility role', () => {
    const element = IngredientRow({ item: mockItem(), onToggle: mockToggle });
    expect(element.props.accessibilityRole).toBe('checkbox');
  });

  it('accepts onEdit prop for long-press editing', () => {
    const element = IngredientRow({
      item: mockItem(),
      onToggle: mockToggle,
      onEdit: mockEdit,
    });
    expect(element).toBeDefined();
  });
});

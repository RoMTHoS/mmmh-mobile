import type { ShoppingListItem } from '../../../src/types';
import { CategoryView } from '../../../src/components/shopping/CategoryView';

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

describe('CategoryView', () => {
  const mockToggle = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('exports the component', () => {
    expect(CategoryView).toBeDefined();
    expect(typeof CategoryView).toBe('function');
  });

  it('accepts items and onToggleItem props', () => {
    const items = [
      mockItem({ id: 'i1', category: 'produce', name: 'Banane' }),
      mockItem({ id: 'i2', category: 'dairy', name: 'Yaourt' }),
    ];

    // Component should accept props without error
    expect(() => CategoryView({ items, onToggleItem: mockToggle })).not.toThrow();
  });

  it('groups items by category', () => {
    const items = [
      mockItem({ id: 'i1', category: 'produce', name: 'Banane' }),
      mockItem({ id: 'i2', category: 'produce', name: 'Pomme' }),
      mockItem({ id: 'i3', category: 'dairy', name: 'Yaourt' }),
    ];

    const element = CategoryView({ items, onToggleItem: mockToggle });
    // SectionList receives sections prop
    expect(element.props.sections).toBeDefined();
    expect(element.props.sections).toHaveLength(2);
    expect(element.props.sections[0].title).toBe('Fruits et légumes');
    expect(element.props.sections[0].data).toHaveLength(2);
    expect(element.props.sections[1].title).toBe('Produits laitiers');
    expect(element.props.sections[1].data).toHaveLength(1);
  });

  it('handles empty items array', () => {
    const element = CategoryView({ items: [], onToggleItem: mockToggle });
    expect(element.props.sections).toEqual([]);
  });

  it('assigns null category to "Autre"', () => {
    const items = [mockItem({ id: 'i1', category: null, name: 'Mystery item' })];

    const element = CategoryView({ items, onToggleItem: mockToggle });
    expect(element.props.sections).toHaveLength(1);
    expect(element.props.sections[0].title).toBe('Autre');
  });

  it('has category-view testID', () => {
    const element = CategoryView({ items: [], onToggleItem: mockToggle });
    expect(element.props.testID).toBe('category-view');
  });
});

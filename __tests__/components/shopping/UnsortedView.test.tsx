import type { ShoppingListItem } from '../../../src/types';
import { UnsortedView } from '../../../src/components/shopping/UnsortedView';

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

describe('UnsortedView', () => {
  const mockToggle = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('exports the component', () => {
    expect(UnsortedView).toBeDefined();
    expect(typeof UnsortedView).toBe('function');
  });

  it('sorts items alphabetically', () => {
    const items = [
      mockItem({ id: 'i1', name: 'Yaourt' }),
      mockItem({ id: 'i2', name: 'Banane' }),
      mockItem({ id: 'i3', name: 'Pomme' }),
    ];

    const element = UnsortedView({ items, onToggleItem: mockToggle });
    const data = element.props.data;
    expect(data[0].name).toBe('Banane');
    expect(data[1].name).toBe('Pomme');
    expect(data[2].name).toBe('Yaourt');
  });

  it('handles empty items', () => {
    const element = UnsortedView({ items: [], onToggleItem: mockToggle });
    expect(element.props.data).toEqual([]);
  });

  it('has unsorted-view testID', () => {
    const element = UnsortedView({ items: [], onToggleItem: mockToggle });
    expect(element.props.testID).toBe('unsorted-view');
  });
});

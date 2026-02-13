import { render, screen, fireEvent } from '@testing-library/react-native';
import type { ShoppingListItem } from '../../../src/types';
import { EditIngredientModal } from '../../../src/components/shopping/EditIngredientModal';

const mockItem = (overrides?: Partial<ShoppingListItem>): ShoppingListItem => ({
  id: 'item-1',
  shoppingListId: 'list-1',
  name: 'Banane',
  quantity: 3,
  unit: 'kg',
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

describe('EditIngredientModal', () => {
  const mockClose = jest.fn();
  const mockSave = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('exports the component', () => {
    expect(EditIngredientModal).toBeDefined();
    expect(typeof EditIngredientModal).toBe('function');
  });

  it('renders modal content when visible', () => {
    render(
      <EditIngredientModal item={mockItem()} visible={true} onClose={mockClose} onSave={mockSave} />
    );

    expect(screen.getByText("Modifier l'ingrédient")).toBeTruthy();
    expect(screen.getByTestId('edit-name-input')).toBeTruthy();
  });

  it('pre-fills input fields with item values', () => {
    render(
      <EditIngredientModal item={mockItem()} visible={true} onClose={mockClose} onSave={mockSave} />
    );

    expect(screen.getByTestId('edit-name-input').props.value).toBe('Banane');
    expect(screen.getByTestId('edit-quantity-input').props.value).toBe('3');
    expect(screen.getByTestId('edit-unit-input').props.value).toBe('kg');
  });

  it('shows convert warning for recipe-sourced items', () => {
    render(
      <EditIngredientModal
        item={mockItem({ sourceType: 'recipe' })}
        visible={true}
        onClose={mockClose}
        onSave={mockSave}
      />
    );

    expect(screen.getByTestId('convert-warning')).toBeTruthy();
  });

  it('does not show convert warning for manual items', () => {
    render(
      <EditIngredientModal
        item={mockItem({ sourceType: 'manual' })}
        visible={true}
        onClose={mockClose}
        onSave={mockSave}
      />
    );

    expect(screen.queryByTestId('convert-warning')).toBeNull();
  });

  it('calls onClose when cancel is pressed', () => {
    render(
      <EditIngredientModal item={mockItem()} visible={true} onClose={mockClose} onSave={mockSave} />
    );

    fireEvent.press(screen.getByTestId('edit-cancel-button'));
    expect(mockClose).toHaveBeenCalled();
  });

  it('calls onSave with updates and convertToManual when saving edited recipe item', () => {
    render(
      <EditIngredientModal
        item={mockItem({ sourceType: 'recipe' })}
        visible={true}
        onClose={mockClose}
        onSave={mockSave}
      />
    );

    fireEvent.changeText(screen.getByTestId('edit-name-input'), 'Banane plantain');
    fireEvent.press(screen.getByTestId('edit-save-button'));

    expect(mockSave).toHaveBeenCalledWith(
      'item-1',
      { name: 'Banane plantain' },
      true // convertToManual because sourceType is 'recipe'
    );
    expect(mockClose).toHaveBeenCalled();
  });

  it('calls onSave without convertToManual for manual items', () => {
    render(
      <EditIngredientModal
        item={mockItem({ sourceType: 'manual' })}
        visible={true}
        onClose={mockClose}
        onSave={mockSave}
      />
    );

    fireEvent.changeText(screen.getByTestId('edit-name-input'), 'Updated name');
    fireEvent.press(screen.getByTestId('edit-save-button'));

    expect(mockSave).toHaveBeenCalledWith(
      'item-1',
      { name: 'Updated name' },
      false // not converting because already manual
    );
  });

  it('closes without saving when no changes are made', () => {
    render(
      <EditIngredientModal item={mockItem()} visible={true} onClose={mockClose} onSave={mockSave} />
    );

    fireEvent.press(screen.getByTestId('edit-save-button'));

    expect(mockSave).not.toHaveBeenCalled();
    expect(mockClose).toHaveBeenCalled();
  });

  it('does not call onSave when name is empty', () => {
    render(
      <EditIngredientModal item={mockItem()} visible={true} onClose={mockClose} onSave={mockSave} />
    );

    fireEvent.changeText(screen.getByTestId('edit-name-input'), '');
    fireEvent.press(screen.getByTestId('edit-save-button'));

    expect(mockSave).not.toHaveBeenCalled();
  });
});

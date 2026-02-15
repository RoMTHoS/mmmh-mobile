jest.mock('expo-sqlite');
jest.mock('react-native-uuid');
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
}));

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { ListSelector } from '../../../src/components/shopping/ListSelector';
import * as shoppingDb from '../../../src/services/shoppingDatabase';
import { useShoppingStore } from '../../../src/stores/shoppingStore';
import type { ShoppingList } from '../../../src/types';

jest.mock('../../../src/services/shoppingDatabase');
const mockShoppingDb = shoppingDb as jest.Mocked<typeof shoppingDb>;

function createQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = createQueryClient();
  return {
    ...render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>),
    queryClient,
  };
}

const defaultList: ShoppingList = {
  id: 'list-1',
  name: 'Ma liste de courses',
  isActive: true,
  isDefault: true,
  mealCount: 2,
  priceEstimateMin: null,
  priceEstimateMax: null,
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
};

const secondList: ShoppingList = {
  id: 'list-2',
  name: 'Dîner samedi',
  isActive: true,
  isDefault: false,
  mealCount: 1,
  priceEstimateMin: null,
  priceEstimateMax: null,
  createdAt: '2024-01-02',
  updatedAt: '2024-01-02',
};

describe('ListSelector', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useShoppingStore.setState({ activeListId: 'list-1' });
    mockShoppingDb.getAllShoppingLists.mockResolvedValue([defaultList, secondList]);
  });

  it('renders the selector button with active list name', async () => {
    const { getByTestId } = renderWithProviders(<ListSelector activeListId="list-1" />);

    await waitFor(() => {
      expect(getByTestId('list-selector-button')).toBeTruthy();
    });
  });

  it('opens dropdown when selector button is pressed', async () => {
    const { getByTestId } = renderWithProviders(<ListSelector activeListId="list-1" />);

    await waitFor(() => {
      expect(getByTestId('list-selector-button')).toBeTruthy();
    });

    fireEvent.press(getByTestId('list-selector-button'));

    await waitFor(() => {
      expect(getByTestId('active-lists')).toBeTruthy();
    });
  });

  it('shows all active lists in dropdown', async () => {
    const { getByTestId } = renderWithProviders(<ListSelector activeListId="list-1" />);

    fireEvent.press(getByTestId('list-selector-button'));

    await waitFor(() => {
      expect(getByTestId('list-item-list-1')).toBeTruthy();
      expect(getByTestId('list-item-list-2')).toBeTruthy();
    });
  });

  it('changes active list on selection', async () => {
    const { getByTestId } = renderWithProviders(<ListSelector activeListId="list-1" />);

    fireEvent.press(getByTestId('list-selector-button'));

    await waitFor(() => {
      expect(getByTestId('list-item-list-2')).toBeTruthy();
    });

    fireEvent.press(getByTestId('list-item-list-2'));

    expect(useShoppingStore.getState().activeListId).toBe('list-2');
  });

  it('shows new list button', async () => {
    const { getByTestId } = renderWithProviders(<ListSelector activeListId="list-1" />);

    fireEvent.press(getByTestId('list-selector-button'));

    await waitFor(() => {
      expect(getByTestId('new-list-button')).toBeTruthy();
    });
  });

  it('shows context menu on long press (non-default list)', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert');
    const { getByTestId } = renderWithProviders(<ListSelector activeListId="list-1" />);

    fireEvent.press(getByTestId('list-selector-button'));

    await waitFor(() => {
      expect(getByTestId('list-item-list-2')).toBeTruthy();
    });

    fireEvent(getByTestId('list-item-list-2'), 'longPress');

    expect(alertSpy).toHaveBeenCalledWith(
      'Dîner samedi',
      undefined,
      expect.arrayContaining([
        expect.objectContaining({ text: 'Renommer' }),
        expect.objectContaining({ text: 'Archiver' }),
        expect.objectContaining({ text: 'Supprimer' }),
        expect.objectContaining({ text: 'Annuler' }),
      ])
    );
  });

  it('shows only Renommer for default list context menu', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert');
    const { getByTestId } = renderWithProviders(<ListSelector activeListId="list-1" />);

    fireEvent.press(getByTestId('list-selector-button'));

    await waitFor(() => {
      expect(getByTestId('list-item-list-1')).toBeTruthy();
    });

    fireEvent(getByTestId('list-item-list-1'), 'longPress');

    const alertArgs = alertSpy.mock.calls[0];
    const options = alertArgs[2] as Array<{ text: string }>;
    const optionTexts = options.map((o) => o.text);
    expect(optionTexts).toContain('Renommer');
    expect(optionTexts).not.toContain('Archiver');
    expect(optionTexts).not.toContain('Supprimer');
  });
});

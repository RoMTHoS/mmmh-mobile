import { useShoppingStore } from '../../src/stores/shoppingStore';

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
}));

describe('shoppingStore', () => {
  beforeEach(() => {
    useShoppingStore.setState({ activeListId: null });
  });

  it('has null activeListId by default', () => {
    expect(useShoppingStore.getState().activeListId).toBeNull();
  });

  it('sets activeListId', () => {
    useShoppingStore.getState().setActiveListId('list-123');

    expect(useShoppingStore.getState().activeListId).toBe('list-123');
  });

  it('overwrites previous activeListId', () => {
    useShoppingStore.getState().setActiveListId('list-1');
    useShoppingStore.getState().setActiveListId('list-2');

    expect(useShoppingStore.getState().activeListId).toBe('list-2');
  });
});

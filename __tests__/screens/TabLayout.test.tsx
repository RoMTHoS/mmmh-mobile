jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('expo-sqlite');
jest.mock('react-native-uuid');
jest.mock('../../src/services/shoppingDatabase');
jest.mock('../../src/utils/ingredientAggregation');
jest.mock('../../src/stores/shoppingStore', () => ({
  useShoppingStore: (selector: (s: { activeListId: string | null }) => unknown) =>
    selector({ activeListId: 'list-1' }),
}));

import TabLayout from '../../app/(tabs)/_layout';
import * as shoppingComponents from '../../src/components/shopping';

describe('TabLayout', () => {
  it('exports the layout component as default', () => {
    expect(TabLayout).toBeDefined();
    expect(typeof TabLayout).toBe('function');
  });
});

describe('Shopping components - ServingsSelector', () => {
  it('exports ServingsSelector from barrel', () => {
    expect(shoppingComponents.ServingsSelector).toBeDefined();
    expect(typeof shoppingComponents.ServingsSelector).toBe('function');
  });
});

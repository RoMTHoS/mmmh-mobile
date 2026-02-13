import { ShoppingEmptyState } from '../../../src/components/shopping/ShoppingEmptyState';

// ShoppingEmptyState uses hooks (useRouter), so we test module exports
// rather than calling it directly

describe('ShoppingEmptyState', () => {
  it('exports the component', () => {
    expect(ShoppingEmptyState).toBeDefined();
    expect(typeof ShoppingEmptyState).toBe('function');
  });

  it('is a React function component', () => {
    // Component should be a function with 0 required props
    expect(ShoppingEmptyState.length).toBe(0);
  });
});

import type { ShoppingList } from '../../../src/types';
import { SummaryBadges } from '../../../src/components/shopping/SummaryBadges';

const mockList = (overrides?: Partial<ShoppingList>): ShoppingList => ({
  id: 'list-1',
  name: 'Ma liste de courses',
  isActive: true,
  mealCount: 3,
  priceEstimateMin: null,
  priceEstimateMax: null,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  ...overrides,
});

// Helper to collect concatenated text from element tree
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function findTextContent(element: Record<string, any>): string[] {
  const texts: string[] = [];
  if (typeof element === 'string' || typeof element === 'number') {
    texts.push(String(element));
  }
  if (element?.props?.children) {
    const children = Array.isArray(element.props.children)
      ? element.props.children
      : [element.props.children];
    const parts: string[] = [];
    for (const child of children) {
      const childTexts = findTextContent(child);
      parts.push(...childTexts);
    }
    // Join children of same parent into single string for matching
    if (parts.length > 0) texts.push(parts.join(''));
  }
  return texts;
}

describe('SummaryBadges', () => {
  it('exports the component', () => {
    expect(SummaryBadges).toBeDefined();
    expect(typeof SummaryBadges).toBe('function');
  });

  it('has summary-badges testID', () => {
    const element = SummaryBadges({ list: mockList() });
    expect(element.props.testID).toBe('summary-badges');
  });

  it('displays meal count', () => {
    const element = SummaryBadges({ list: mockList({ mealCount: 5 }) });
    const texts = findTextContent(element);
    expect(texts.some((t) => t.includes('5 repas'))).toBe(true);
  });

  it('shows "— €" when price estimates are null', () => {
    const element = SummaryBadges({
      list: mockList({ priceEstimateMin: null, priceEstimateMax: null }),
    });
    const texts = findTextContent(element);
    expect(texts.some((t) => t.includes('— €'))).toBe(true);
  });

  it('shows price range when estimates exist', () => {
    const element = SummaryBadges({
      list: mockList({ priceEstimateMin: 55, priceEstimateMax: 75 }),
    });
    const texts = findTextContent(element);
    expect(texts.some((t) => t.includes('55-75 €'))).toBe(true);
  });

  it('shows single price when min equals max', () => {
    const element = SummaryBadges({
      list: mockList({ priceEstimateMin: 50, priceEstimateMax: 50 }),
    });
    const texts = findTextContent(element);
    expect(texts.some((t) => t.includes('50 €'))).toBe(true);
  });
});

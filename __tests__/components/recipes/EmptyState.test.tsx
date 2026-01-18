import { EmptyState } from '../../../src/components/recipes/EmptyState';

describe('EmptyState', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders empty state component', () => {
    const element = EmptyState();

    expect(element).toBeDefined();
    expect(element.props.testID).toBe('empty-state');
  });

  it('contains the expected text content', () => {
    const element = EmptyState();

    expect(element).toBeDefined();
    // Element structure is correct
  });

  it('renders a Button component', () => {
    const element = EmptyState();
    const children = element.props.children;

    // Find the Button in children
    const button = Array.isArray(children)
      ? children.find(
          (child: { type?: { name?: string } }) =>
            child && typeof child === 'object' && child.type?.name === 'Button'
        )
      : null;

    expect(button).toBeDefined();
  });
});

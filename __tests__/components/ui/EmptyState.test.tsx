import { EmptyState } from '../../../src/components/ui/EmptyState';

describe('EmptyState', () => {
  it('renders with title and description', () => {
    const element = EmptyState({
      icon: 'search',
      title: 'No results',
      description: 'Try another search',
    });

    expect(element).toBeDefined();
    expect(element.props.testID).toBe('empty-state');
  });

  it('renders without action button when no actionLabel', () => {
    const element = EmptyState({
      icon: 'bookmark',
      title: 'Empty',
      description: 'Nothing here',
    });

    const children = element.props.children;
    // Should have icon, title, description but no Button
    const flatChildren = Array.isArray(children) ? children.filter(Boolean) : [children];
    // 3 elements: Icon, Title Text, Description Text (no Button since actionLabel is undefined)
    expect(flatChildren.length).toBe(3);
  });

  it('renders CTA button when actionLabel and onAction provided', () => {
    const onAction = jest.fn();
    const element = EmptyState({
      icon: 'bookmark',
      title: 'No recipes',
      description: 'Start importing',
      actionLabel: 'Import Recipe',
      onAction,
    });

    const children = element.props.children;
    const flatChildren = Array.isArray(children) ? children.filter(Boolean) : [children];
    // 4 elements: Icon, Title, Description, Button
    expect(flatChildren.length).toBe(4);
  });

  it('has correct accessibility role', () => {
    const element = EmptyState({
      icon: 'search',
      title: 'Test',
      description: 'Test desc',
    });

    expect(element.props.accessibilityRole).toBe('text');
  });
});

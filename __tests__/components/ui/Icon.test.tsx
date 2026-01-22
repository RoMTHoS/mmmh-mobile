import { Icon } from '../../../src/components/ui/Icon';

describe('Icon', () => {
  it('renders with name prop', () => {
    const element = Icon({ name: 'home' });

    expect(element).toBeDefined();
  });

  it('renders with different icon names', () => {
    const icons = [
      'arrow-left',
      'bookmark',
      'calories',
      'camera',
      'cart',
      'cost',
      'globe',
      'home',
      'menu',
      'pencil',
      'plus',
      'plus-circle',
      'search',
      'servings',
      'share',
      'text',
      'time',
    ] as const;

    icons.forEach((name) => {
      const element = Icon({ name });
      expect(element).toBeDefined();
    });
  });

  it('renders with sm size', () => {
    const element = Icon({ name: 'home', size: 'sm' });

    expect(element.props.width).toBe(16);
    expect(element.props.height).toBe(16);
  });

  it('renders with md size (default)', () => {
    const element = Icon({ name: 'home' });

    expect(element.props.width).toBe(20);
    expect(element.props.height).toBe(20);
  });

  it('renders with lg size', () => {
    const element = Icon({ name: 'home', size: 'lg' });

    expect(element.props.width).toBe(24);
    expect(element.props.height).toBe(24);
  });

  it('renders with custom numeric size', () => {
    const element = Icon({ name: 'home', size: 32 });

    expect(element.props.width).toBe(32);
    expect(element.props.height).toBe(32);
  });

  it('renders with custom color', () => {
    const element = Icon({ name: 'home', color: '#FF0000' });

    expect(element).toBeDefined();
  });
});

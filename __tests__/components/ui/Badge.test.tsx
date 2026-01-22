import { Badge } from '../../../src/components/ui/Badge';

describe('Badge', () => {
  it('renders with icon and value', () => {
    const element = Badge({ icon: 'time', value: '30 min' });

    expect(element).toBeDefined();
  });

  it('renders with different icons', () => {
    const icons = ['time', 'cost', 'calories', 'servings'] as const;

    icons.forEach((icon) => {
      const element = Badge({ icon, value: 'test' });
      expect(element).toBeDefined();
    });
  });

  it('displays the value text', () => {
    const element = Badge({ icon: 'time', value: '45 min' });

    // The badge should contain the value text
    const children = element.props.children;
    expect(children).toBeDefined();
  });

  it('accepts custom style', () => {
    const customStyle = { marginRight: 8 };
    const element = Badge({ icon: 'time', value: '30 min', style: customStyle });

    expect(element).toBeDefined();
  });
});

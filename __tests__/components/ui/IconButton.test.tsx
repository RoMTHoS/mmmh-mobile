import { IconButton } from '../../../src/components/ui/IconButton';

describe('IconButton', () => {
  it('renders with icon prop', () => {
    const onPress = jest.fn();
    const element = IconButton({ icon: 'pencil', onPress });

    expect(element).toBeDefined();
  });

  it('passes onPress handler', () => {
    const onPress = jest.fn();
    const element = IconButton({ icon: 'pencil', onPress });

    expect(element.props.onPress).toBe(onPress);
  });

  it('is disabled when disabled prop is true', () => {
    const onPress = jest.fn();
    const element = IconButton({ icon: 'pencil', onPress, disabled: true });

    expect(element.props.disabled).toBe(true);
  });

  it('sets accessibility label', () => {
    const onPress = jest.fn();
    const element = IconButton({
      icon: 'pencil',
      onPress,
      accessibilityLabel: 'Edit item',
    });

    expect(element.props.accessibilityLabel).toBe('Edit item');
  });

  it('has button accessibility role', () => {
    const onPress = jest.fn();
    const element = IconButton({ icon: 'pencil', onPress });

    expect(element.props.accessibilityRole).toBe('button');
  });

  it('renders with custom color', () => {
    const onPress = jest.fn();
    const element = IconButton({ icon: 'trash-outline', onPress, color: '#EF4444' });

    expect(element).toBeDefined();
  });

  it('renders with custom size', () => {
    const onPress = jest.fn();
    const element = IconButton({ icon: 'pencil', onPress, size: 32 });

    expect(element).toBeDefined();
  });
});

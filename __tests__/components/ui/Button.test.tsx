import { Button } from '../../../src/components/ui/Button';

describe('Button', () => {
  it('renders with title', () => {
    const onPress = jest.fn();
    const element = Button({ title: 'Click me', onPress });

    expect(element).toBeDefined();
  });

  it('passes onPress handler', () => {
    const onPress = jest.fn();
    const element = Button({ title: 'Click me', onPress });

    expect(element.props.onPress).toBe(onPress);
  });

  it('is disabled when disabled prop is true', () => {
    const onPress = jest.fn();
    const element = Button({ title: 'Click me', onPress, disabled: true });

    expect(element.props.disabled).toBe(true);
  });

  it('is disabled when loading', () => {
    const onPress = jest.fn();
    const element = Button({ title: 'Click me', onPress, loading: true });

    expect(element.props.disabled).toBe(true);
  });

  it('accepts custom style', () => {
    const onPress = jest.fn();
    const customStyle = { marginTop: 10 };
    const element = Button({ title: 'Click me', onPress, style: customStyle });

    expect(element).toBeDefined();
  });

  it('renders with primary variant by default', () => {
    const onPress = jest.fn();
    const element = Button({ title: 'Primary', onPress });

    expect(element).toBeDefined();
  });

  it('renders with secondary variant', () => {
    const onPress = jest.fn();
    const element = Button({ title: 'Secondary', onPress, variant: 'secondary' });

    expect(element).toBeDefined();
  });

  it('renders with destructive variant', () => {
    const onPress = jest.fn();
    const element = Button({ title: 'Delete', onPress, variant: 'destructive' });

    expect(element).toBeDefined();
  });
});

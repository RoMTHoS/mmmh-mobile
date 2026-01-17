import { LoadingScreen } from '../../../src/components/ui/LoadingScreen';

describe('LoadingScreen', () => {
  it('renders a View component', () => {
    const element = LoadingScreen();

    expect(element).toBeDefined();
    expect(element.type).toBeDefined();
  });

  it('renders an ActivityIndicator as child', () => {
    const element = LoadingScreen();

    expect(element.props.children).toBeDefined();
  });

  it('has styles applied', () => {
    const element = LoadingScreen();

    expect(element.props.style).toBeDefined();
  });
});

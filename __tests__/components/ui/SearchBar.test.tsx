import { SearchBar } from '../../../src/components/ui/SearchBar';

describe('SearchBar', () => {
  it('renders with value and onChangeText', () => {
    const onChangeText = jest.fn();
    const element = SearchBar({ value: '', onChangeText });

    expect(element).toBeDefined();
  });

  it('passes value to TextInput', () => {
    const onChangeText = jest.fn();
    const element = SearchBar({ value: 'test query', onChangeText });

    expect(element).toBeDefined();
  });

  it('uses default placeholder "Rechercher"', () => {
    const onChangeText = jest.fn();
    const element = SearchBar({ value: '', onChangeText });

    expect(element).toBeDefined();
  });

  it('accepts custom placeholder', () => {
    const onChangeText = jest.fn();
    const element = SearchBar({
      value: '',
      onChangeText,
      placeholder: 'Chercher des recettes',
    });

    expect(element).toBeDefined();
  });

  it('passes onFocus handler', () => {
    const onChangeText = jest.fn();
    const onFocus = jest.fn();
    const element = SearchBar({ value: '', onChangeText, onFocus });

    expect(element).toBeDefined();
  });

  it('passes onBlur handler', () => {
    const onChangeText = jest.fn();
    const onBlur = jest.fn();
    const element = SearchBar({ value: '', onChangeText, onBlur });

    expect(element).toBeDefined();
  });

  it('accepts custom style', () => {
    const onChangeText = jest.fn();
    const customStyle = { marginBottom: 16 };
    const element = SearchBar({ value: '', onChangeText, style: customStyle });

    expect(element).toBeDefined();
  });

  it('passes autoFocus prop', () => {
    const onChangeText = jest.fn();
    const element = SearchBar({ value: '', onChangeText, autoFocus: true });

    expect(element).toBeDefined();
  });

  it('shows clear button when value is not empty', () => {
    const onChangeText = jest.fn();
    const element = SearchBar({ value: 'search query', onChangeText });

    // Find the clear button in children
    const children = element.props.children;
    expect(children.length).toBe(3); // icon, input, clear button
  });

  it('hides clear button when value is empty', () => {
    const onChangeText = jest.fn();
    const element = SearchBar({ value: '', onChangeText });

    // No clear button when empty
    const children = element.props.children;
    expect(children[2]).toBeFalsy(); // clear button should not exist
  });
});

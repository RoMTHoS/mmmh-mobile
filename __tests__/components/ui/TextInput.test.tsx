import React from 'react';
import { TextInput } from '../../../src/components/ui/TextInput';

// Mock react-native components
jest.mock('react-native', () => ({
  TextInput: (props: Record<string, unknown>) =>
    React.createElement('input', {
      ...props,
      'data-testid': 'text-input',
    }),
  View: ({ children }: { children: React.ReactNode }) => React.createElement('div', {}, children),
  Text: ({ children, style }: { children: React.ReactNode; style?: unknown }) =>
    React.createElement('span', { style, 'data-testid': 'text' }, children),
  StyleSheet: {
    create: <T extends Record<string, unknown>>(styles: T): T => styles,
  },
}));

describe('TextInput', () => {
  it('renders without label', () => {
    const element = TextInput({ placeholder: 'Enter text' });

    expect(element).toBeDefined();
    expect(element.props.children).toHaveLength(3);
    // First child (label) should be falsy
    expect(element.props.children[0]).toBeFalsy();
  });

  it('renders with label', () => {
    const element = TextInput({ label: 'Name', placeholder: 'Enter name' });

    expect(element.props.children[0]).toBeTruthy();
    expect(element.props.children[0].props.children).toBe('Name');
  });

  it('shows error message when error prop is provided', () => {
    const element = TextInput({ error: 'This field is required' });

    const errorElement = element.props.children[2];
    expect(errorElement).toBeTruthy();
    expect(errorElement.props.children).toBe('This field is required');
  });

  it('does not show error when no error prop', () => {
    const element = TextInput({ placeholder: 'Enter text' });

    const errorElement = element.props.children[2];
    expect(errorElement).toBeFalsy();
  });

  it('applies error styles when error is present', () => {
    const element = TextInput({ error: 'Error' });

    const inputElement = element.props.children[1];
    const styles = inputElement.props.style;

    expect(styles).toEqual(
      expect.arrayContaining([expect.objectContaining({ borderColor: '#EF4444' })])
    );
  });

  it('applies multiline styles when multiline prop is true', () => {
    const element = TextInput({ multiline: true });

    const inputElement = element.props.children[1];
    const styles = inputElement.props.style;

    expect(styles).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ minHeight: 100, textAlignVertical: 'top' }),
      ])
    );
  });

  it('passes through additional TextInput props', () => {
    const onChangeText = jest.fn();
    const element = TextInput({
      placeholder: 'Enter text',
      onChangeText,
      autoCapitalize: 'none',
    });

    const inputElement = element.props.children[1];
    expect(inputElement.props.placeholder).toBe('Enter text');
    expect(inputElement.props.onChangeText).toBe(onChangeText);
    expect(inputElement.props.autoCapitalize).toBe('none');
  });
});

import React from 'react';
import { Text } from 'react-native';
import { Card } from '../../../src/components/ui/Card';

describe('Card', () => {
  it('renders with children', () => {
    const element = Card({
      children: React.createElement(Text, null, 'Card content'),
    });

    expect(element).toBeDefined();
  });

  it('renders as View when no onPress', () => {
    const element = Card({
      children: React.createElement(Text, null, 'Static card'),
    });

    expect(element.type.name || element.type.displayName || element.type).not.toBe('Pressable');
  });

  it('renders as Pressable when onPress provided', () => {
    const onPress = jest.fn();
    const element = Card({
      children: React.createElement(Text, null, 'Clickable card'),
      onPress,
    });

    expect(element.props.onPress).toBe(onPress);
    expect(element.props.accessibilityRole).toBe('button');
  });

  it('accepts custom padding', () => {
    const element = Card({
      children: React.createElement(Text, null, 'Padded card'),
      padding: 'lg',
    });

    expect(element).toBeDefined();
  });

  it('accepts numeric padding', () => {
    const element = Card({
      children: React.createElement(Text, null, 'Custom padded card'),
      padding: 24,
    });

    expect(element).toBeDefined();
  });

  it('renders with shadow by default', () => {
    const element = Card({
      children: React.createElement(Text, null, 'Shadow card'),
    });

    expect(element).toBeDefined();
  });

  it('can disable shadow', () => {
    const element = Card({
      children: React.createElement(Text, null, 'No shadow card'),
      shadow: false,
    });

    expect(element).toBeDefined();
  });

  it('accepts custom style', () => {
    const customStyle = { marginTop: 10 };
    const element = Card({
      children: React.createElement(Text, null, 'Styled card'),
      style: customStyle,
    });

    expect(element).toBeDefined();
  });
});

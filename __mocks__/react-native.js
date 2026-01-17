const React = require('react');

const View = ({ children, style, testID }) =>
  React.createElement('View', { style, testID, 'data-testid': testID }, children);

const Text = ({ children, style, testID }) =>
  React.createElement('Text', { style, testID, 'data-testid': testID }, children);

const TouchableOpacity = ({ children, onPress, style, testID }) =>
  React.createElement(
    'TouchableOpacity',
    {
      style,
      testID,
      'data-testid': testID,
      onClick: onPress,
    },
    children
  );

const Pressable = ({ children, onPress, style, testID, hitSlop, disabled }) =>
  React.createElement(
    'Pressable',
    {
      style: typeof style === 'function' ? style({ pressed: false }) : style,
      testID,
      'data-testid': testID,
      onClick: onPress,
      disabled,
    },
    children
  );

const ScrollView = ({ children, style, contentContainerStyle, testID, keyboardShouldPersistTaps }) =>
  React.createElement(
    'ScrollView',
    { style, contentContainerStyle, testID, 'data-testid': testID, keyboardShouldPersistTaps },
    children
  );

const Image = ({ source, style, testID }) =>
  React.createElement('Image', { src: source?.uri, style, testID, 'data-testid': testID });

const TextInput = ({
  value,
  onChangeText,
  onBlur,
  placeholder,
  style,
  testID,
  multiline,
  keyboardType,
  numberOfLines,
  autoFocus,
  placeholderTextColor,
}) =>
  React.createElement('TextInput', {
    value,
    onChange: (e) => onChangeText?.(e.target?.value || ''),
    onBlur,
    placeholder,
    style,
    testID,
    'data-testid': testID,
    multiline,
    keyboardType,
    numberOfLines,
    autoFocus,
    placeholderTextColor,
  });

const ActivityIndicator = ({ size, color, testID }) =>
  React.createElement('ActivityIndicator', { size, color, testID, 'data-testid': testID });

const Alert = {
  alert: jest.fn(),
};

const StyleSheet = {
  create: (styles) => styles,
};

module.exports = {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  ScrollView,
  Image,
  TextInput,
  ActivityIndicator,
  Alert,
  StyleSheet,
};

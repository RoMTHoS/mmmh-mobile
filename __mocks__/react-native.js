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
  absoluteFill: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
  absoluteFillObject: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
  flatten: (style) => {
    if (!style) return {};
    if (Array.isArray(style)) {
      return style.reduce((acc, s) => ({ ...acc, ...StyleSheet.flatten(s) }), {});
    }
    return style;
  },
};

const Modal = ({ children, visible, transparent, animationType, onRequestClose }) =>
  visible
    ? React.createElement(
        'Modal',
        { transparent, animationType, onRequestClose },
        children
      )
    : null;

const Platform = {
  OS: 'ios',
  select: (obj) => obj.ios || obj.default,
};

const Linking = {
  openURL: jest.fn(() => Promise.resolve()),
  openSettings: jest.fn(() => Promise.resolve()),
};

const KeyboardAvoidingView = ({ children, style, behavior }) =>
  React.createElement('KeyboardAvoidingView', { style, behavior }, children);

// Animated mock
const AnimatedValue = jest.fn().mockImplementation((value) => ({
  _value: value,
  setValue: jest.fn(),
  interpolate: jest.fn(() => value),
}));

const Animated = {
  Value: AnimatedValue,
  View: View,
  Text: Text,
  Image: Image,
  timing: jest.fn(() => ({
    start: jest.fn((callback) => callback && callback()),
  })),
  spring: jest.fn(() => ({
    start: jest.fn((callback) => callback && callback()),
  })),
  parallel: jest.fn((animations) => ({
    start: jest.fn((callback) => callback && callback()),
  })),
  sequence: jest.fn((animations) => ({
    start: jest.fn((callback) => callback && callback()),
  })),
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
  Modal,
  Platform,
  Linking,
  KeyboardAvoidingView,
  Animated,
};

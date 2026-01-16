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

const StyleSheet = {
  create: (styles) => styles,
};

module.exports = {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
};

const React = require('react');

const useSafeAreaInsets = jest.fn(() => ({
  top: 0,
  bottom: 0,
  left: 0,
  right: 0,
}));

const SafeAreaProvider = ({ children }) =>
  React.createElement('SafeAreaProvider', null, children);

const SafeAreaView = ({ children, style }) =>
  React.createElement('SafeAreaView', { style }, children);

module.exports = {
  useSafeAreaInsets,
  SafeAreaProvider,
  SafeAreaView,
};

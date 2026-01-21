// Define __DEV__ before any modules load
global.__DEV__ = true;

// Mock react-native-svg
jest.mock('react-native-svg', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: (props) => React.createElement('Svg', props),
    Svg: (props) => React.createElement('Svg', props),
    Path: (props) => React.createElement('Path', props),
    Circle: (props) => React.createElement('Circle', props),
    G: (props) => React.createElement('G', props),
    Rect: (props) => React.createElement('Rect', props),
    Line: (props) => React.createElement('Line', props),
    Text: (props) => React.createElement('SvgText', props),
  };
});

// Suppress react-test-renderer deprecation warning
// @testing-library/react-native v13.x still uses react-test-renderer internally.
// This warning can be removed when upgrading to @testing-library/react-native v14+
// which will use a new renderer that doesn't depend on react-test-renderer.
// See: https://github.com/callstack/react-native-testing-library/issues/1618
const originalConsoleError = console.error;
console.error = (...args) => {
  if (
    typeof args[0] === 'string' &&
    args[0].includes('react-test-renderer is deprecated')
  ) {
    return;
  }
  originalConsoleError.apply(console, args);
};

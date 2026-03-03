const React = require('react');

const useSharedValue = jest.fn((init) => ({ value: init }));
const useAnimatedStyle = jest.fn((fn) => fn());
const withSpring = jest.fn((toValue) => toValue);
const withTiming = jest.fn((toValue, _config, callback) => {
  if (callback) callback(true);
  return toValue;
});
const withRepeat = jest.fn((animation) => animation);
const cancelAnimation = jest.fn();
const runOnJS = jest.fn((fn) => fn);

const Easing = {
  ease: 'ease',
  inOut: jest.fn(() => 'inOut'),
};

const Animated = {
  View: ({ children, style, ...props }) =>
    React.createElement('Animated.View', { style, ...props }, children),
  Text: ({ children, style, ...props }) =>
    React.createElement('Animated.Text', { style, ...props }, children),
};

module.exports = {
  __esModule: true,
  default: Animated,
  ...Animated,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  cancelAnimation,
  runOnJS,
  Easing,
};

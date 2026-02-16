const React = require('react');

const Swipeable = React.forwardRef(function Swipeable(props, ref) {
  return React.createElement('Swipeable', { ...props, ref }, props.children);
});

const GestureHandlerRootView = (props) =>
  React.createElement('GestureHandlerRootView', props, props.children);

module.exports = {
  Swipeable,
  GestureHandlerRootView,
  Directions: {},
  State: {},
  PanGestureHandler: (props) => React.createElement('PanGestureHandler', props, props.children),
  TapGestureHandler: (props) => React.createElement('TapGestureHandler', props, props.children),
  FlingGestureHandler: (props) =>
    React.createElement('FlingGestureHandler', props, props.children),
  LongPressGestureHandler: (props) =>
    React.createElement('LongPressGestureHandler', props, props.children),
  gestureHandlerRootHOC: (component) => component,
};

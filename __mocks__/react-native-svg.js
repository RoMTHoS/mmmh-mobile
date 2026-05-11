const React = require('react');

const createMockComponent = (name) => {
  const component = (props) => {
    return React.createElement('View', { testID: `svg-${name}` }, props.children);
  };
  component.displayName = name;
  return component;
};

const Svg = createMockComponent('Svg');

exports.__esModule = true;
exports.default = Svg;
exports.Svg = Svg;
exports.Path = createMockComponent('Path');
exports.Ellipse = createMockComponent('Ellipse');
exports.Circle = createMockComponent('Circle');
exports.Rect = createMockComponent('Rect');
exports.G = createMockComponent('G');
exports.Line = createMockComponent('Line');

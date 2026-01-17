const React = require('react');

const Toast = () => null;
Toast.show = jest.fn();
Toast.hide = jest.fn();

module.exports = Toast;
module.exports.default = Toast;

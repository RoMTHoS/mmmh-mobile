const React = require('react');

// Legacy mock - kept for backward compatibility with existing tests
const Toast = () => null;
Toast.show = jest.fn();
Toast.hide = jest.fn();

module.exports = Toast;
module.exports.default = Toast;

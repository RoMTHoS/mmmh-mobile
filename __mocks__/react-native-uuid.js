// Mock react-native-uuid for testing

let counter = 0;

const uuid = {
  v4: jest.fn(() => `test-uuid-${++counter}`),
};

module.exports = uuid;
module.exports.default = uuid;
module.exports.__resetCounter = () => {
  counter = 0;
};

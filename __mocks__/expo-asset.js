module.exports = {
  Asset: {
    fromModule: jest.fn(() => ({
      downloadAsync: jest.fn(),
      localUri: 'mocked-local-uri',
      uri: 'mocked-uri',
    })),
    loadAsync: jest.fn(),
  },
};

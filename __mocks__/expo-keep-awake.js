module.exports = {
  useKeepAwake: jest.fn(),
  activateKeepAwake: jest.fn(),
  activateKeepAwakeAsync: jest.fn().mockResolvedValue(undefined),
  deactivateKeepAwake: jest.fn(),
};

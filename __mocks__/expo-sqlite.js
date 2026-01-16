// Mock expo-sqlite for testing

const mockRunSync = jest.fn();
const mockGetFirstSync = jest.fn();
const mockGetAllSync = jest.fn();
const mockExecSync = jest.fn();
const mockCloseSync = jest.fn();

const mockDatabase = {
  runSync: mockRunSync,
  getFirstSync: mockGetFirstSync,
  getAllSync: mockGetAllSync,
  execSync: mockExecSync,
  closeSync: mockCloseSync,
};

const openDatabaseSync = jest.fn(() => mockDatabase);

module.exports = {
  openDatabaseSync,
  __mockDatabase: mockDatabase,
  __resetMocks: () => {
    mockRunSync.mockReset();
    mockGetFirstSync.mockReset();
    mockGetAllSync.mockReset();
    mockExecSync.mockReset();
    mockCloseSync.mockReset();
    openDatabaseSync.mockClear();
  },
};

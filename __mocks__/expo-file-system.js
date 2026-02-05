const FileSystemUploadType = {
  MULTIPART: 1,
  BINARY_CONTENT: 0,
};

const uploadAsync = jest.fn((url, uri, options) =>
  Promise.resolve({
    status: 202,
    body: JSON.stringify({
      data: {
        jobId: 'mock-job-id-123',
        estimatedTime: 30,
        queuePosition: 1,
      },
    }),
  })
);

const getInfoAsync = jest.fn((uri) =>
  Promise.resolve({
    exists: true,
    uri,
    size: 1024000,
    isDirectory: false,
  })
);

module.exports = {
  documentDirectory: 'file:///mock/documents/',
  cacheDirectory: 'file:///mock/cache/',
  FileSystemUploadType,
  getInfoAsync,
  uploadAsync,
  readAsStringAsync: jest.fn(() => Promise.resolve('mock-file-content')),
  writeAsStringAsync: jest.fn(() => Promise.resolve()),
  deleteAsync: jest.fn(() => Promise.resolve()),
  copyAsync: jest.fn(() => Promise.resolve()),
  moveAsync: jest.fn(() => Promise.resolve()),
  makeDirectoryAsync: jest.fn(() => Promise.resolve()),
};

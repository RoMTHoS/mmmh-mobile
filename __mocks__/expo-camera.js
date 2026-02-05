module.exports = {
  Camera: {
    requestCameraPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
    useCameraPermissions: jest.fn(() => [
      { granted: true },
      jest.fn(() => Promise.resolve({ status: 'granted' })),
    ]),
  },
  CameraView: 'CameraView',
  useCameraPermissions: jest.fn(() => [
    { granted: true },
    jest.fn(() => Promise.resolve({ status: 'granted' })),
  ]),
};

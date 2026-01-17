module.exports = {
  launchImageLibraryAsync: jest.fn().mockResolvedValue({
    canceled: false,
    assets: [{ uri: 'file://mock-image.jpg' }],
  }),
  launchCameraAsync: jest.fn().mockResolvedValue({
    canceled: false,
    assets: [{ uri: 'file://mock-camera.jpg' }],
  }),
  requestCameraPermissionsAsync: jest.fn().mockResolvedValue({
    granted: true,
    status: 'granted',
  }),
  requestMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({
    granted: true,
    status: 'granted',
  }),
  MediaTypeOptions: {
    All: 'All',
    Images: 'Images',
    Videos: 'Videos',
  },
};

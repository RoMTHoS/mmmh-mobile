module.exports = {
  SaveFormat: {
    JPEG: 'jpeg',
    PNG: 'png',
    WEBP: 'webp',
  },
  manipulateAsync: jest.fn((uri, actions, options) =>
    Promise.resolve({
      uri: uri.replace(/\.\w+$/, '_edited.jpg'),
      width: 1024,
      height: 768,
    })
  ),
};

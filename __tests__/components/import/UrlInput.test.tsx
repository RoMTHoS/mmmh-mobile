import { UrlInput } from '../../../src/components/import/UrlInput';

// Mock expo-clipboard
jest.mock('expo-clipboard', () => ({
  getStringAsync: jest.fn(() => Promise.resolve('')),
}));

describe('UrlInput', () => {
  describe('module exports', () => {
    it('exports UrlInput component', () => {
      expect(UrlInput).toBeDefined();
      expect(typeof UrlInput).toBe('function');
    });
  });

  describe('component interface', () => {
    it('accepts required props', () => {
      // Verify the component function signature accepts the expected props
      expect(UrlInput.length).toBe(1); // Single props object
    });
  });
});

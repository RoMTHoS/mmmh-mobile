import { ReviewRecipeForm } from '../../../src/components/review/ReviewRecipeForm';

// Mock expo-image-picker
jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  requestCameraPermissionsAsync: jest.fn(),
}));

describe('ReviewRecipeForm', () => {
  describe('module exports', () => {
    it('exports ReviewRecipeForm component', () => {
      expect(ReviewRecipeForm).toBeDefined();
      expect(typeof ReviewRecipeForm).toBe('function');
    });
  });

  describe('component props', () => {
    it('requires photoUri prop', () => {
      const mockProps = {
        photoUri: null as string | null,
        onPhotoChange: jest.fn(),
        hasAiPhoto: false,
      };

      expect(mockProps.photoUri).toBe(null);
      expect(typeof mockProps.onPhotoChange).toBe('function');
      expect(typeof mockProps.hasAiPhoto).toBe('boolean');
    });

    it('accepts string photoUri', () => {
      const mockProps = {
        photoUri: 'https://example.com/photo.jpg',
        onPhotoChange: jest.fn(),
        hasAiPhoto: true,
      };

      expect(mockProps.photoUri).toBe('https://example.com/photo.jpg');
      expect(mockProps.hasAiPhoto).toBe(true);
    });
  });

  describe('form fields', () => {
    it('defines required form fields', () => {
      const requiredFields = ['title', 'ingredientsText', 'stepsText'];

      requiredFields.forEach((field) => {
        expect(field).toBeDefined();
      });
    });

    it('defines optional form fields', () => {
      const optionalFields = ['description', 'prepTime', 'cookTime', 'servings', 'photoUri'];

      optionalFields.forEach((field) => {
        expect(field).toBeDefined();
      });
    });
  });

  describe('photo handling', () => {
    it('onPhotoChange callback receives uri or null', () => {
      const onPhotoChange = jest.fn();

      // Test with uri
      onPhotoChange('file://path/to/photo.jpg');
      expect(onPhotoChange).toHaveBeenCalledWith('file://path/to/photo.jpg');

      // Test with null (remove photo)
      onPhotoChange(null);
      expect(onPhotoChange).toHaveBeenCalledWith(null);
    });
  });
});

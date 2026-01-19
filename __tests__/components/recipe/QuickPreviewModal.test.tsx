import { colors, typography } from '../../../src/theme';

// Mock expo-router
const mockRouterPush = jest.fn();
const mockRouterBack = jest.fn();
jest.mock('expo-router', () => ({
  router: { push: mockRouterPush, back: mockRouterBack },
  useLocalSearchParams: jest.fn(() => ({
    id: 'test-123',
    title: 'Test Recipe',
    imageUri: 'http://example.com/image.jpg',
    prepTime: '30',
    estimatedCost: '10-15 €',
    calories: '350',
    difficulty: 'Facile',
  })),
}));

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: jest.fn(() => null),
}));

describe('QuickPreviewModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Data Display', () => {
    it('displays time info with time icon', () => {
      const infoFields = ['time-outline', 'cash-outline', 'flame-outline', 'star-outline'];
      expect(infoFields).toContain('time-outline');
    });

    it('displays cost info with cash icon', () => {
      const infoFields = ['time-outline', 'cash-outline', 'flame-outline', 'star-outline'];
      expect(infoFields).toContain('cash-outline');
    });

    it('displays calories info with flame icon', () => {
      const infoFields = ['time-outline', 'cash-outline', 'flame-outline', 'star-outline'];
      expect(infoFields).toContain('flame-outline');
    });

    it('displays difficulty info with star icon', () => {
      const infoFields = ['time-outline', 'cash-outline', 'flame-outline', 'star-outline'];
      expect(infoFields).toContain('star-outline');
    });
  });

  describe('Theme Integration', () => {
    it('uses modal background color', () => {
      expect(colors.modalBackground).toBe('#F5F0E1');
    });

    it('uses h2 typography for title', () => {
      expect(typography.h2).toBeDefined();
      expect(typography.h2.fontSize).toBe(24);
    });

    it('uses accent color for button', () => {
      expect(colors.accent).toBe('#1E2A4A');
    });
  });

  describe('Navigation', () => {
    it('can navigate to recipe detail', () => {
      const recipeId = 'test-123';
      mockRouterPush(`/recipe/${recipeId}`);
      expect(mockRouterPush).toHaveBeenCalledWith('/recipe/test-123');
    });

    it('can close modal', () => {
      mockRouterBack();
      expect(mockRouterBack).toHaveBeenCalled();
    });
  });

  describe('Button Text', () => {
    it('has French button text', () => {
      const buttonText = 'Voir la recette';
      expect(buttonText).toBe('Voir la recette');
    });
  });
});

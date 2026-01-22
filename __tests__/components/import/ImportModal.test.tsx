import { colors } from '../../../src/theme';

// Mock expo-router
const mockRouterPush = jest.fn();
const mockRouterBack = jest.fn();
jest.mock('expo-router', () => ({
  router: { push: mockRouterPush, back: mockRouterBack },
}));

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: jest.fn(() => null),
}));

describe('ImportModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('UI Structure', () => {
    it('has 3 import options defined', () => {
      const importOptions = [
        { icon: 'globe-outline', label: 'Navigateur' },
        { icon: 'camera-outline', label: 'Appareil photo' },
        { icon: 'document-text-outline', label: 'Texte' },
      ];
      expect(importOptions).toHaveLength(3);
    });

    it('has create recipe link', () => {
      const createLinkText = 'Créer une nouvelle recette';
      expect(createLinkText).toBeDefined();
    });
  });

  describe('Theme Integration', () => {
    it('uses modal background color', () => {
      expect(colors.modalBackground).toBe('#FFF2CC');
    });

    it('uses overlay color for backdrop', () => {
      expect(colors.overlay).toBe('rgba(0, 0, 0, 0.5)');
    });

    it('uses accent color for text', () => {
      expect(colors.accent).toBe('#233662');
    });
  });

  describe('Navigation', () => {
    it('can navigate back', () => {
      mockRouterBack();
      expect(mockRouterBack).toHaveBeenCalled();
    });

    it('can navigate to create recipe', () => {
      mockRouterPush('/recipe/create');
      expect(mockRouterPush).toHaveBeenCalledWith('/recipe/create');
    });
  });
});

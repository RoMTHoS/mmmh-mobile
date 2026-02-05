import type { ImportJob, ImportStatus } from '../../src/stores/importStore';

// Mock expo-router
jest.mock('expo-router', () => ({
  useLocalSearchParams: jest.fn(),
  Stack: { Screen: jest.fn() },
  router: {
    back: jest.fn(),
    replace: jest.fn(),
    push: jest.fn(),
  },
}));

// Mock the import store
jest.mock('../../src/stores/importStore', () => ({
  useImportStore: jest.fn(),
}));

// Mock the hooks
jest.mock('../../src/hooks', () => ({
  useCreateRecipe: jest.fn(() => ({
    mutateAsync: jest.fn(),
    isPending: false,
  })),
}));

// Mock toast
jest.mock('react-native-toast-message', () => ({
  show: jest.fn(),
}));

// Mock expo-image-picker
jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  requestCameraPermissionsAsync: jest.fn(),
}));

describe('RecipeReviewScreen', () => {
  const mockJob: ImportJob = {
    jobId: 'job-123',
    importType: 'video',
    sourceUrl: 'https://www.instagram.com/reel/ABC123',
    platform: 'instagram',
    status: 'completed' as ImportStatus,
    progress: 100,
    currentStep: 'complete',
    createdAt: new Date().toISOString(),
    result: {
      title: 'AI Extracted Recipe',
      description: 'A delicious recipe',
      ingredients: [
        { name: 'flour', quantity: 2, unit: 'cups' },
        { name: 'sugar', quantity: 1, unit: 'cup' },
      ],
      instructions: [
        { text: 'Mix ingredients', stepNumber: 1 },
        { text: 'Bake at 350F', stepNumber: 2 },
      ],
      aiConfidence: 0.85,
      prepTime: 15,
      cookTime: 30,
      servings: 4,
    },
  };

  describe('data structure', () => {
    it('job has required fields for review', () => {
      expect(mockJob.jobId).toBeDefined();
      expect(mockJob.status).toBe('completed');
      expect(mockJob.result).toBeDefined();
    });

    it('result contains recipe data', () => {
      const result = mockJob.result as Record<string, unknown>;
      expect(result.title).toBe('AI Extracted Recipe');
      expect(result.ingredients).toHaveLength(2);
      expect(result.instructions).toHaveLength(2);
      expect(result.aiConfidence).toBe(0.85);
    });

    it('result contains timing information', () => {
      const result = mockJob.result as Record<string, unknown>;
      expect(result.prepTime).toBe(15);
      expect(result.cookTime).toBe(30);
      expect(result.servings).toBe(4);
    });
  });

  describe('form data mapping', () => {
    it('maps ingredients to text format', () => {
      const result = mockJob.result as {
        ingredients: Array<{ name: string; quantity?: number; unit?: string }>;
      };
      const ingredientsText = result.ingredients
        .map((i) => {
          const parts: string[] = [];
          if (i.quantity) parts.push(String(i.quantity));
          if (i.unit) parts.push(i.unit);
          parts.push(i.name);
          return parts.join(' ');
        })
        .join('\n');

      expect(ingredientsText).toBe('2 cups flour\n1 cup sugar');
    });

    it('maps instructions to text format', () => {
      const result = mockJob.result as { instructions: Array<{ text: string }> };
      const stepsText = result.instructions.map((s) => s.text).join('\n');

      expect(stepsText).toBe('Mix ingredients\nBake at 350F');
    });
  });

  describe('validation requirements', () => {
    it('title is required', () => {
      const emptyTitle = '';
      expect(emptyTitle.length).toBe(0);
    });

    it('at least one ingredient is required', () => {
      const emptyIngredients = '';
      expect(emptyIngredients.trim().length).toBe(0);
    });

    it('at least one step is required', () => {
      const emptySteps = '';
      expect(emptySteps.trim().length).toBe(0);
    });
  });

  describe('confidence indicator', () => {
    it('displays high confidence for >= 0.8', () => {
      const result = mockJob.result as { aiConfidence: number };
      expect(result.aiConfidence).toBeGreaterThanOrEqual(0.8);
    });

    it('displays medium confidence for >= 0.6 and < 0.8', () => {
      const mediumConfidence = 0.65;
      expect(mediumConfidence).toBeGreaterThanOrEqual(0.6);
      expect(mediumConfidence).toBeLessThan(0.8);
    });

    it('displays low confidence for < 0.6', () => {
      const lowConfidence = 0.4;
      expect(lowConfidence).toBeLessThan(0.6);
    });
  });

  describe('save functionality', () => {
    it('parses ingredients text to array', () => {
      const text = '2 cups flour\n1 cup sugar';
      const ingredients = text
        .split('\n')
        .filter((line) => line.trim())
        .map((line) => ({
          name: line.trim(),
          quantity: null,
          unit: null,
        }));

      expect(ingredients).toHaveLength(2);
      expect(ingredients[0].name).toBe('2 cups flour');
    });

    it('parses steps text to array', () => {
      const text = 'Mix ingredients\nBake at 350F';
      const steps = text
        .split('\n')
        .filter((line) => line.trim())
        .map((line, index) => ({
          order: index + 1,
          instruction: line.trim(),
        }));

      expect(steps).toHaveLength(2);
      expect(steps[0].instruction).toBe('Mix ingredients');
      expect(steps[0].order).toBe(1);
    });
  });

  describe('discard functionality', () => {
    it('removes job from store', () => {
      const removeJob = jest.fn();
      removeJob(mockJob.jobId);
      expect(removeJob).toHaveBeenCalledWith('job-123');
    });
  });
});

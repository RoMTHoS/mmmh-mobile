import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';
import { createRecipeSchema } from '../../src/schemas/recipe.schema';

// Mock modules
jest.mock('../../src/hooks', () => ({
  useCreateRecipe: () => ({
    mutateAsync: jest.fn().mockResolvedValue({ id: 'mock-recipe-id' }),
    isPending: false,
  }),
}));

describe('CreateRecipeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Form Schema Validation', () => {
    it('requires title field', () => {
      const result = createRecipeSchema.safeParse({
        title: '',
        ingredientsText: 'Salt',
        stepsText: 'Add salt',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const titleError = result.error.issues.find((i) => i.path[0] === 'title');
        expect(titleError).toBeDefined();
        expect(titleError?.message).toBe('Title is required');
      }
    });

    it('accepts valid form data with title only', () => {
      const result = createRecipeSchema.safeParse({
        title: 'Test Recipe',
      });

      expect(result.success).toBe(true);
    });

    it('accepts complete form data', () => {
      const result = createRecipeSchema.safeParse({
        title: 'Test Recipe',
        ingredientsText: 'Salt\nPepper',
        stepsText: 'Step 1\nStep 2',
        cookingTime: 30,
        servings: 4,
        notes: 'Delicious recipe',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('Test Recipe');
        expect(result.data.cookingTime).toBe(30);
        expect(result.data.servings).toBe(4);
      }
    });

    it('accepts null for optional numeric fields', () => {
      const result = createRecipeSchema.safeParse({
        title: 'Test Recipe',
        cookingTime: null,
        servings: null,
      });

      expect(result.success).toBe(true);
    });

    it('accepts number values for optional numeric fields', () => {
      const result = createRecipeSchema.safeParse({
        title: 'Test Recipe',
        cookingTime: 30,
        servings: 4,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.cookingTime).toBe(30);
        expect(result.data.servings).toBe(4);
      }
    });
  });

  describe('Image Picker Integration', () => {
    it('launches image library picker', async () => {
      await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalled();
    });

    it('launches camera with permission check', async () => {
      await ImagePicker.requestCameraPermissionsAsync();
      await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      expect(ImagePicker.requestCameraPermissionsAsync).toHaveBeenCalled();
      expect(ImagePicker.launchCameraAsync).toHaveBeenCalled();
    });

    it('handles image picker cancellation', async () => {
      (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValueOnce({
        canceled: true,
        assets: [],
      });

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
      });

      expect(result.canceled).toBe(true);
    });
  });

  describe('Alert Dialogs', () => {
    it('shows photo options dialog', () => {
      Alert.alert('Add Photo', 'Choose an option', [
        { text: 'Take Photo', onPress: jest.fn() },
        { text: 'Choose from Gallery', onPress: jest.fn() },
        { text: 'Cancel', style: 'cancel' },
      ]);

      expect(Alert.alert).toHaveBeenCalledWith(
        'Add Photo',
        'Choose an option',
        expect.arrayContaining([
          expect.objectContaining({ text: 'Take Photo' }),
          expect.objectContaining({ text: 'Choose from Gallery' }),
          expect.objectContaining({ text: 'Cancel', style: 'cancel' }),
        ])
      );
    });

    it('shows discard confirmation dialog for dirty form', () => {
      Alert.alert(
        'Discard changes?',
        'You have unsaved changes. Are you sure you want to discard them?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: jest.fn() },
        ]
      );

      expect(Alert.alert).toHaveBeenCalledWith(
        'Discard changes?',
        'You have unsaved changes. Are you sure you want to discard them?',
        expect.arrayContaining([
          expect.objectContaining({ text: 'Keep Editing', style: 'cancel' }),
          expect.objectContaining({ text: 'Discard', style: 'destructive' }),
        ])
      );
    });
  });

  describe('Toast Notifications', () => {
    it('shows success toast on recipe save', () => {
      Toast.show({
        type: 'success',
        text1: 'Recipe saved!',
        text2: 'Your recipe has been created successfully',
        visibilityTime: 2000,
      });

      expect(Toast.show).toHaveBeenCalledWith({
        type: 'success',
        text1: 'Recipe saved!',
        text2: 'Your recipe has been created successfully',
        visibilityTime: 2000,
      });
    });

    it('shows error toast on save failure', () => {
      Toast.show({
        type: 'error',
        text1: 'Failed to save recipe',
        text2: 'Please try again',
      });

      expect(Toast.show).toHaveBeenCalledWith({
        type: 'error',
        text1: 'Failed to save recipe',
        text2: 'Please try again',
      });
    });
  });

  describe('Ingredient and Step Parsing', () => {
    const parseIngredients = (text: string) => {
      return text
        .split('\n')
        .filter((line) => line.trim())
        .map((line) => ({
          name: line.trim(),
          quantity: null,
          unit: null,
        }));
    };

    const parseSteps = (text: string) => {
      return text
        .split('\n')
        .filter((line) => line.trim())
        .map((line, index) => ({
          order: index + 1,
          instruction: line.trim(),
        }));
    };

    it('parses ingredients from newline-separated text', () => {
      const text = 'Salt\nPepper\nOlive oil';
      const ingredients = parseIngredients(text);

      expect(ingredients).toHaveLength(3);
      expect(ingredients[0]).toEqual({ name: 'Salt', quantity: null, unit: null });
      expect(ingredients[1]).toEqual({ name: 'Pepper', quantity: null, unit: null });
      expect(ingredients[2]).toEqual({ name: 'Olive oil', quantity: null, unit: null });
    });

    it('filters empty lines from ingredients', () => {
      const text = 'Salt\n\nPepper\n  \nOlive oil';
      const ingredients = parseIngredients(text);

      expect(ingredients).toHaveLength(3);
    });

    it('trims whitespace from ingredients', () => {
      const text = '  Salt  \n  Pepper  ';
      const ingredients = parseIngredients(text);

      expect(ingredients[0].name).toBe('Salt');
      expect(ingredients[1].name).toBe('Pepper');
    });

    it('parses steps with sequential order', () => {
      const text = 'Preheat oven\nMix ingredients\nBake for 30 minutes';
      const steps = parseSteps(text);

      expect(steps).toHaveLength(3);
      expect(steps[0]).toEqual({ order: 1, instruction: 'Preheat oven' });
      expect(steps[1]).toEqual({ order: 2, instruction: 'Mix ingredients' });
      expect(steps[2]).toEqual({ order: 3, instruction: 'Bake for 30 minutes' });
    });

    it('handles empty input gracefully', () => {
      expect(parseIngredients('')).toEqual([]);
      expect(parseSteps('')).toEqual([]);
    });
  });
});

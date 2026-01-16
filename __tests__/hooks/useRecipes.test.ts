import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import {
  useRecipes,
  useRecipe,
  useCreateRecipe,
  useUpdateRecipe,
  useDeleteRecipe,
} from '../../src/hooks/useRecipes';
import * as db from '../../src/services/database';
import type { Recipe } from '../../src/types';

jest.mock('expo-sqlite');
jest.mock('react-native-uuid');
jest.mock('../../src/services/database');

const mockDb = db as jest.Mocked<typeof db>;

const mockRecipe: Recipe = {
  id: 'test-id-1',
  title: 'Test Recipe',
  ingredients: [{ name: 'Salt', quantity: '1', unit: 'tsp' }],
  steps: [{ order: 1, instruction: 'Add salt' }],
  cookingTime: 30,
  servings: 4,
  photoUri: null,
  notes: null,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe('Recipe Hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useRecipes', () => {
    it('should fetch all recipes', async () => {
      mockDb.getAllRecipes.mockResolvedValue([mockRecipe]);

      const { result } = renderHook(() => useRecipes(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual([mockRecipe]);
      expect(mockDb.getAllRecipes).toHaveBeenCalledTimes(1);
    });

    it('should handle empty recipe list', async () => {
      mockDb.getAllRecipes.mockResolvedValue([]);

      const { result } = renderHook(() => useRecipes(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual([]);
    });

    it('should handle fetch error', async () => {
      mockDb.getAllRecipes.mockRejectedValue(new Error('Database error'));

      const { result } = renderHook(() => useRecipes(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeInstanceOf(Error);
    });
  });

  describe('useRecipe', () => {
    it('should fetch single recipe by id', async () => {
      mockDb.getRecipeById.mockResolvedValue(mockRecipe);

      const { result } = renderHook(() => useRecipe('test-id-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockRecipe);
      expect(mockDb.getRecipeById).toHaveBeenCalledWith('test-id-1');
    });

    it('should return null for non-existent recipe', async () => {
      mockDb.getRecipeById.mockResolvedValue(null);

      const { result } = renderHook(() => useRecipe('non-existent'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBeNull();
    });

    it('should not fetch when id is empty', async () => {
      const { result } = renderHook(() => useRecipe(''), {
        wrapper: createWrapper(),
      });

      expect(result.current.fetchStatus).toBe('idle');
      expect(mockDb.getRecipeById).not.toHaveBeenCalled();
    });
  });

  describe('useCreateRecipe', () => {
    it('should create recipe', async () => {
      mockDb.createRecipe.mockResolvedValue(mockRecipe);

      const { result } = renderHook(() => useCreateRecipe(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        title: 'Test Recipe',
        ingredients: [{ name: 'Salt', quantity: '1', unit: 'tsp' }],
        steps: [{ order: 1, instruction: 'Add salt' }],
        cookingTime: 30,
        servings: 4,
        photoUri: null,
        notes: null,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockDb.createRecipe).toHaveBeenCalledTimes(1);
    });
  });

  describe('useUpdateRecipe', () => {
    it('should update recipe', async () => {
      const updatedRecipe = { ...mockRecipe, title: 'Updated Title' };
      mockDb.updateRecipe.mockResolvedValue(updatedRecipe);

      const { result } = renderHook(() => useUpdateRecipe(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        id: 'test-id-1',
        input: { title: 'Updated Title' },
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockDb.updateRecipe).toHaveBeenCalledWith('test-id-1', {
        title: 'Updated Title',
      });
    });
  });

  describe('useDeleteRecipe', () => {
    it('should delete recipe', async () => {
      mockDb.deleteRecipe.mockResolvedValue(undefined);

      const { result } = renderHook(() => useDeleteRecipe(), {
        wrapper: createWrapper(),
      });

      result.current.mutate('test-id-1');

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockDb.deleteRecipe).toHaveBeenCalledWith('test-id-1');
    });
  });
});

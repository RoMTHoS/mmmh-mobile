import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Collection {
  id: string;
  name: string;
  type: 'recipeBook' | 'menu';
  recipeIds: string[];
  recipeServings: Record<string, number>;
  createdAt: string;
}

interface CollectionStore {
  collections: Collection[];
  addCollection: (name: string, type: 'recipeBook' | 'menu') => Collection;
  removeCollection: (id: string) => void;
  addRecipeToCollection: (collectionId: string, recipeId: string) => void;
  removeRecipeFromCollection: (collectionId: string, recipeId: string) => void;
  setRecipeServings: (collectionId: string, recipeId: string, servings: number) => void;
  getRecipeBooks: () => Collection[];
  getMenus: () => Collection[];
}

export const useCollectionStore = create<CollectionStore>()(
  persist(
    (set, get) => ({
      collections: [],

      addCollection: (name, type) => {
        const newCollection: Collection = {
          id: `collection-${Date.now()}`,
          name,
          type,
          recipeIds: [],
          recipeServings: {},
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          collections: [...state.collections, newCollection],
        }));
        return newCollection;
      },

      removeCollection: (id) => {
        set((state) => ({
          collections: state.collections.filter((c) => c.id !== id),
        }));
      },

      addRecipeToCollection: (collectionId, recipeId) => {
        set((state) => ({
          collections: state.collections.map((c) =>
            c.id === collectionId && !c.recipeIds.includes(recipeId)
              ? { ...c, recipeIds: [...c.recipeIds, recipeId] }
              : c
          ),
        }));
      },

      removeRecipeFromCollection: (collectionId, recipeId) => {
        set((state) => ({
          collections: state.collections.map((c) => {
            if (c.id !== collectionId) return c;
            const servings = { ...(c.recipeServings ?? {}) };
            delete servings[recipeId];
            return {
              ...c,
              recipeIds: c.recipeIds.filter((r) => r !== recipeId),
              recipeServings: servings,
            };
          }),
        }));
      },

      setRecipeServings: (collectionId, recipeId, servings) => {
        set((state) => ({
          collections: state.collections.map((c) =>
            c.id === collectionId
              ? { ...c, recipeServings: { ...(c.recipeServings ?? {}), [recipeId]: servings } }
              : c
          ),
        }));
      },

      getRecipeBooks: () => get().collections.filter((c) => c.type === 'recipeBook'),

      getMenus: () => get().collections.filter((c) => c.type === 'menu'),
    }),
    {
      name: 'collection-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

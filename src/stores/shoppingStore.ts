import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ShoppingStore {
  activeListId: string | null;
  setActiveListId: (id: string) => void;
}

export const useShoppingStore = create<ShoppingStore>()(
  persist(
    (set) => ({
      activeListId: null,

      setActiveListId: (id) => {
        set({ activeListId: id });
      },
    }),
    {
      name: 'shopping-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

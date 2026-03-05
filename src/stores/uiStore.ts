import { create } from 'zustand';

interface UIStore {
  importModalVisible: boolean;
  openImportModal: () => void;
  closeImportModal: () => void;
}

export const useUIStore = create<UIStore>()((set) => ({
  importModalVisible: false,
  openImportModal: () => set({ importModalVisible: true }),
  closeImportModal: () => set({ importModalVisible: false }),
}));

import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
}

interface ToastStore {
  toasts: ToastItem[];
  showToast: (message: string, type: ToastType, duration?: number) => void;
  dismissToast: (id: string) => void;
}

const DEFAULT_DURATIONS: Record<ToastType, number> = {
  success: 2000,
  error: 5000,
  info: 3000,
};

let toastCounter = 0;

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  showToast: (message, type, duration) => {
    const id = `toast-${++toastCounter}`;
    const toastDuration = duration ?? DEFAULT_DURATIONS[type];
    set((state) => ({
      toasts: [...state.toasts, { id, message, type, duration: toastDuration }],
    }));
  },
  dismissToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
}));

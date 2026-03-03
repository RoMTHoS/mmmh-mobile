import { useToastStore, type ToastType } from '../stores/toastStore';

/**
 * Imperative toast helper for use outside React components.
 * Calls the Zustand store directly.
 */
export function showToast(message: string, type: ToastType, duration?: number) {
  useToastStore.getState().showToast(message, type, duration);
}

/**
 * Compatibility adapter for react-native-toast-message format.
 * Maps Toast.show({ type, text1, text2 }) to our custom toast store.
 */
export const Toast = {
  show: (config: { type?: string; text1?: string; text2?: string; visibilityTime?: number }) => {
    const type = (
      config.type === 'error' ? 'error' : config.type === 'info' ? 'info' : 'success'
    ) as ToastType;
    const message = [config.text1, config.text2].filter(Boolean).join(' — ');
    showToast(message, type, config.visibilityTime);
  },
  hide: () => {
    const { toasts, dismissToast } = useToastStore.getState();
    if (toasts.length > 0) {
      dismissToast(toasts[toasts.length - 1].id);
    }
  },
};
